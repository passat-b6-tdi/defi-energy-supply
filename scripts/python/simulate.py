import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Fetch real historical weather data for Kyiv
API = "https://archive-api.open-meteo.com/v1/archive"
params = {
    "latitude":   50.4501,
    "longitude":  30.5234,
    "start_date": "2024-03-01",
    "end_date":   "2024-03-10",
    "hourly":     "cloudcover,windspeed_10m,shortwave_radiation,temperature_2m,pressure_msl",
    "timezone":   "Europe/Kyiv",
}
resp = requests.get(API, params=params)
resp.raise_for_status()
h = resp.json()["hourly"]

# 2. Build DataFrame
times = pd.to_datetime(h["time"])
weather = pd.DataFrame({
    "cloud_cover": np.array(h["cloudcover"], dtype=float) / 100.0,   # → [0,1]
    "wind_speed":  np.array(h["windspeed_10m"], dtype=float),        # m/s
    "solar_irr":   np.array(h["shortwave_radiation"], dtype=float),  # W/m²
    "temp":        np.array(h["temperature_2m"], dtype=float),       # °C
    "pressure":    np.array(h["pressure_msl"], dtype=float) * 100.0, # Pa
}, index=times)

# 3. Detailed solar model: tilt, temp coeff., soiling, air density
tilt_opt    = 35.0   # optimal tilt in Kyiv
tilt_actual = 30.0   # your panel tilt
f_tilt      = np.cos(np.radians(tilt_actual - tilt_opt))

NOCT       = 45.0    # Nominal Operating Cell Temp (°C)
weather["cell_temp"] = weather["temp"] + weather["solar_irr"]/800 * (NOCT - 20)
temp_coeff  = -0.004 # –0.4 % / °C
weather["f_temp"]  = 1 + temp_coeff * (weather["cell_temp"] - 25)

weather["f_soil"]  = 0.95  # 5% loss due to dirt/snow

R = 287.05  # J/(kg·K)
weather["rho"]    = weather["pressure"] / (R * (weather["temp"] + 273.15))
weather["f_rho"]  = weather["rho"] / 1.225

# 4. Compute solar generation with all factors
n_houses = 5
panel_kw = 3  # kW per house at STC
weather["solar_gen"] = (
      weather["solar_irr"]
    * f_tilt
    * weather["f_temp"]
    * weather["f_soil"]
    * weather["f_rho"]
    / 1000
    * n_houses * panel_kw
)

# 5. Wind generation (simple cubic curve)
wind_capacity = 15  # kW total
def wind_power_curve(ws):
    if ws < 3 or ws > 25:
        return 0.0
    if ws < 12:
        return wind_capacity * ((ws - 3)/9)**3
    return wind_capacity

weather["wind_gen"] = weather["wind_speed"].apply(wind_power_curve)

# 6. Synthetic per-house consumption
np.random.seed(7)
hour = weather.index.hour + weather.index.minute / 60
cons_dict = {}
for i in range(n_houses):
    base = np.random.uniform(0.8,1.2,len(weather))
    daily = 0.5 * np.sin((hour-17)/12*np.pi)
    noise = np.random.normal(0,0.05,len(weather))
    cons = base + daily + noise
    cons_dict[f"House {i+1}"] = np.clip(cons, 0.5, 2.5)
cons_df = pd.DataFrame(cons_dict, index=weather.index)
weather["demand"] = cons_df.sum(axis=1)

# 7. Simulate battery (strict energy limits + internal balance)
battery_caps = [10, 20, 50]  # kWh
charge_limit = 5             # kW
discharge_limit = 5          # kW
eta_ch, eta_dis = 0.95, 0.95
self_discharge = 0.001       # 0.1% per hour

soc_dict = {}
import_dict = {}
export_dict = {}
charge_energy_dict = {}
discharge_energy_dict = {}

for cap in battery_caps:
    T = len(weather)
    soc = np.zeros(T); soc[0] = cap
    imp = np.zeros(T); exp = np.zeros(T)
    charge_energy = np.zeros(T)
    discharge_energy = np.zeros(T)

    for t in range(1, T):
        # self-discharge
        soc[t-1] *= (1 - self_discharge)

        gen = weather["solar_gen"].iat[t] + weather["wind_gen"].iat[t]
        dem = weather["demand"].iat[t]

        if gen >= dem:
            surplus = gen - dem
            # power we can put into battery
            P_ch = min(surplus, charge_limit)
            # energy after efficiency
            E_ch = min(P_ch * eta_ch, cap - soc[t-1])
            soc[t] = soc[t-1] + E_ch
            exp[t] = max(0, surplus - P_ch)
            charge_energy[t] = E_ch
        else:
            deficit = dem - gen
            P_dis = min(deficit, discharge_limit)
            E_dis = min(P_dis / eta_dis, soc[t-1])
            soc[t] = soc[t-1] - E_dis
            rem = deficit - E_dis * eta_dis
            imp[t] = max(0, rem)
            discharge_energy[t] = E_dis

    soc_dict[cap] = soc
    import_dict[cap] = imp
    export_dict[cap] = exp
    charge_energy_dict[cap] = charge_energy
    discharge_energy_dict[cap] = discharge_energy

    # internal balance checks
    net_ch = charge_energy.sum()
    net_dis = discharge_energy.sum()
    print(f"🔋 {cap}kWh → charged {net_ch:.1f} kWh, discharged {net_dis:.1f} kWh, Δ={net_ch-net_dis:.1f} kWh")
    mc = charge_energy.max()
    md = discharge_energy.max()
    print(f"    max per-hour energy: charge {mc:.3f} ≤ {charge_limit*eta_ch:.1f}, discharge {md:.3f} ≤ {discharge_limit/eta_dis:.1f}")

# 8. Plot results

# 8.1 Consumption
plt.figure(figsize=(10,4))
for col in cons_df.columns:
    plt.plot(cons_df.index, cons_df[col], label=col)
plt.title("Hourly Consumption per House")
plt.ylabel("kW")
plt.legend(loc="upper right")
plt.tight_layout()
plt.show()

# 8.2 Generation
plt.figure(figsize=(10,4))
plt.plot(weather.index, weather["solar_gen"], label="Solar (kW)")
plt.plot(weather.index, weather["wind_gen"],  label="Wind  (kW)")
plt.title("Hourly Generation")
plt.ylabel("kW")
plt.legend()
plt.tight_layout()
plt.show()

# 8.3 SoC with shading
for cap in battery_caps:
    soc = soc_dict[cap]
    delta = soc - np.roll(soc,1); delta[0]=0
    status = np.where(delta>1e-6,"charging",
              np.where(delta<-1e-6,"discharging","idle"))
    plt.figure(figsize=(10,4))
    plt.fill_between(weather.index, 0, soc, where=status=="charging",
                     color="green", alpha=0.3, label="Charging")
    plt.fill_between(weather.index, 0, soc, where=status=="discharging",
                     color="red",   alpha=0.3, label="Discharging")
    plt.plot(weather.index, soc, color="black", label=f"SoC {cap} kWh")
    plt.title(f"Battery (Capacity {cap} kWh)")
    plt.ylabel("kWh")
    plt.legend(loc="upper right")
    plt.tight_layout()
    plt.show()

# 8.4 Grid imports
plt.figure(figsize=(10,4))
for cap, imp in import_dict.items():
    plt.plot(weather.index, imp, label=f"Import {cap} kW")
plt.title("Grid Imports")
plt.ylabel("kW")
plt.legend()
plt.tight_layout()
plt.show()

# 8.5 Grid exports
plt.figure(figsize=(10,4))
for cap, exp in export_dict.items():
    plt.plot(weather.index, exp, label=f"Export {cap} kW")
plt.title("Grid Exports")
plt.ylabel("kW")
plt.legend()
plt.tight_layout()
plt.show()

# 9. Net import checks
for cap in battery_caps:
    net = import_dict[cap].sum() - export_dict[cap].sum()
    print(f"{cap} kWh → net import: {net:.3f} kWh")
