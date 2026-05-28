import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# === 0. Константи ===
LATITUDE = 50.4501
LONGITUDE = 30.5234
START_DATE = "2024-03-01"
END_DATE = "2024-03-10"
TIMEZONE = "Europe/Kyiv"

SOLAR_PANEL_KW = 3
WIND_TURBINE_KW = 15
N_HOUSES = 5

TILT_OPT = 35.0
TILT_ACTUAL = 30.0
NOCT = 45.0
TEMP_COEFF = -0.004
SOILING_FACTOR = 0.95
INVERTER_EFFICIENCY = 0.97

BATTERY_CAPACITIES = [10, 20, 50]
CHARGE_LIMIT_KW = 5
DISCHARGE_LIMIT_KW = 5
ETA_CH = 0.95
ETA_DIS = 0.95
SELF_DISCHARGE = 0.001

BUY_PRICE = 0.15
SELL_PRICE = 0.10

# === 1. Завантаження даних ===
def fetch_weather():
    API = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "hourly": "cloudcover,windspeed_10m,shortwave_radiation,temperature_2m,pressure_msl",
        "timezone": "UTC",
    }
    resp = requests.get(API, params=params)
    resp.raise_for_status()
    return resp.json()["hourly"]

# === 2. Обробка даних ===
def prepare_weather_data(h):
    times = pd.to_datetime(h["time"]).tz_localize("UTC").tz_convert(TIMEZONE)
    weather = pd.DataFrame({
        "cloud_cover": np.array(h["cloudcover"], dtype=float) / 100.0,
        "wind_speed":  np.array(h["windspeed_10m"], dtype=float),
        "solar_irr":   np.array(h["shortwave_radiation"], dtype=float),
        "temp":        np.array(h["temperature_2m"], dtype=float),
        "pressure":    np.array(h["pressure_msl"], dtype=float) * 100.0,
    }, index=times)
    
    weather = weather.sort_index().asfreq('h')
    weather.interpolate(method='time', inplace=True)
    weather['cloud_cover'] = weather['cloud_cover'].clip(0, 1)
    weather['temp'] = weather['temp'].clip(-30, 40)

    for col in ['wind_speed', 'solar_irr']:
        mu, sigma = weather[col].mean(), weather[col].std()
        mask = (weather[col] < mu - 3*sigma) | (weather[col] > mu + 3*sigma)
        weather.loc[mask, col] = np.nan
    weather[['wind_speed', 'solar_irr']] = weather[['wind_speed', 'solar_irr']].interpolate(method='time')

    return weather

# === 3. Генерація енергії ===
def compute_generation(weather):
    f_tilt = np.cos(np.radians(TILT_ACTUAL - TILT_OPT))

    R = 287.05
    weather["rho"] = weather["pressure"] / (R * (weather["temp"] + 273.15))
    weather["f_rho"] = weather["rho"] / 1.225

    weather["cell_temp"] = weather["temp"] + weather["solar_irr"] / 800 * (NOCT - 20)
    weather["f_temp"] = 1 + TEMP_COEFF * (weather["cell_temp"] - 25)

    weather["solar_gen"] = (
        weather["solar_irr"]
        * f_tilt
        * weather["f_temp"]
        * SOILING_FACTOR
        * weather["f_rho"]
        / 1000
        * SOLAR_PANEL_KW * N_HOUSES
        * INVERTER_EFFICIENCY
    )

    def wind_power(ws):
        if ws < 3: return 0
        if ws < 12: return WIND_TURBINE_KW * ((ws - 3) / (12 - 3))**3
        if ws < 25: return WIND_TURBINE_KW
        return 0

    weather["wind_gen"] = weather["wind_speed"].apply(wind_power) * INVERTER_EFFICIENCY

    return weather

# === 4. Генерація споживання ===
def generate_consumption(weather):
    np.random.seed(7)
    hour = weather.index.hour + weather.index.minute / 60
    cons_dict = {}
    for i in range(N_HOUSES):
        base = np.random.uniform(0.8, 1.2, len(weather))
        daily = 0.5 * np.sin((hour-17)/12*np.pi)
        noise = np.random.normal(0, 0.05, len(weather))
        cons = base + daily + noise
        cons_dict[f"House {i+1}"] = np.clip(cons, 0.5, 2.5)
    cons_df = pd.DataFrame(cons_dict, index=weather.index)
    weather["demand"] = cons_df.sum(axis=1)
    return weather, cons_df

# === 5. Симуляція батарей ===
def simulate_battery(weather):
    soc_dict, import_dict, export_dict = {}, {}, {}
    for cap in BATTERY_CAPACITIES:
        T = len(weather)
        soc = np.zeros(T); soc[0] = cap
        imp = np.zeros(T); exp = np.zeros(T)
        for t in range(1, T):
            soc[t-1] *= (1 - SELF_DISCHARGE)
            gen = weather["solar_gen"].iat[t] + weather["wind_gen"].iat[t]
            dem = weather["demand"].iat[t]
            if gen >= dem:
                surplus = gen - dem
                P_ch = min(surplus, CHARGE_LIMIT_KW)
                E_ch = min(P_ch * ETA_CH, cap - soc[t-1])
                soc[t] = soc[t-1] + E_ch
                exp[t] = max(0, surplus - P_ch)
            else:
                deficit = dem - gen
                P_dis = min(deficit, DISCHARGE_LIMIT_KW)
                E_dis = min(P_dis / ETA_DIS, soc[t-1])
                soc[t] = soc[t-1] - E_dis
                rem = deficit - E_dis * ETA_DIS
                imp[t] = max(0, rem)
        soc_dict[cap] = soc
        import_dict[cap] = imp
        export_dict[cap] = exp
    return soc_dict, import_dict, export_dict

# === 6. Перевірка балансу енергії ===
def check_balance(weather, soc_dict, import_dict, export_dict):
    for cap in BATTERY_CAPACITIES:
        net_gen = (weather["solar_gen"] + weather["wind_gen"]).sum()
        net_demand = weather["demand"].sum()
        net_imp = import_dict[cap].sum()
        net_exp = export_dict[cap].sum()
        soc_delta = soc_dict[cap][-1] - soc_dict[cap][0]
        balance = (net_gen + net_imp) - (net_demand + net_exp + soc_delta)
        print(f"Battery {cap} kWh → Energy balance error: {balance:.3f} kWh")

# === 7. Основний скрипт ===
def main():
    weather_raw = fetch_weather()
    weather = prepare_weather_data(weather_raw)
    weather = compute_generation(weather)
    weather, cons_df = generate_consumption(weather)
    soc_dict, import_dict, export_dict = simulate_battery(weather)
    check_balance(weather, soc_dict, import_dict, export_dict)

    plt.figure(figsize=(10,5))
    plt.plot(weather.index, weather["solar_gen"], label="Solar Generation (kW)")
    plt.plot(weather.index, weather["wind_gen"], label="Wind Generation (kW)")
    plt.plot(weather.index, weather["demand"], label="Total Demand (kW)")
    plt.legend(); plt.title("Generation and Total Demand"); plt.grid(); plt.show()

    plt.figure(figsize=(12,6))
    for col in cons_df.columns:
        plt.plot(cons_df.index, cons_df[col], label=col)
    plt.title("Hourly Consumption per House")
    plt.ylabel("kW")
    plt.legend()
    plt.grid()
    plt.show()

    # Окремі графіки для кожної батареї
    for cap in BATTERY_CAPACITIES:
        plt.figure(figsize=(10,5))
        plt.plot(weather.index, soc_dict[cap], label=f"SoC ({cap} kWh)")
        plt.legend(); plt.title(f"Battery State of Charge ({cap} kWh)"); plt.grid(); plt.show()

    # Зведений графік SoC для всіх ємностей
    plt.figure(figsize=(14,6))
    for cap in BATTERY_CAPACITIES:
        plt.plot(weather.index, soc_dict[cap], label=f"SoC {cap} kWh")
    plt.title("State of Charge for Different Battery Capacities")
    plt.ylabel("kWh")
    plt.xlabel("Time")
    plt.legend()
    plt.grid()
    plt.show()

    plt.figure(figsize=(16, 7))
    for cap, imp in import_dict.items():
        plt.plot(weather.index, imp, label=f"Import {cap} kWh", linestyle='-')
    for cap, exp in export_dict.items():
        plt.plot(weather.index, exp, label=f"Export {cap} kWh", linestyle='--')
    plt.title("Grid Imports and Exports")
    plt.ylabel("kW")
    plt.xlabel("Time")
    plt.legend()
    plt.grid()
    plt.show()

if __name__ == "__main__":
    main()
