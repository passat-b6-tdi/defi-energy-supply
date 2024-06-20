import os
from web3 import Web3
from dotenv import load_dotenv
from telegram import Update, BotCommand
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

load_dotenv()

telegramToken = os.getenv("TELEGRAM_TOKEN")

# Initialize web3 with Infura API
infuraApiKey = os.getenv("INFURA_KEY")
w3 = Web3(Web3.HTTPProvider(f'https://arbitrum-sepolia.infura.io/v3/{infuraApiKey}'))

sepolia_scan_link='https://sepolia.arbiscan.io/tx/'

# ABI for Main SC
main_abi = '''
[{"inputs":[{"internalType":"contract Manager","name":"_manager","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"OnlyEnergyOracleProvider","type":"error"},{"inputs":[],"name":"OnlyEnergySupplier","type":"error"},{"inputs":[],"name":"ZeroAddressPassed","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAIN_MANAGER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract Manager","name":"_newManager","type":"address"}],"name":"changeManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"supplierId","type":"uint256"}],"name":"getRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"manager","outputs":[{"internalType":"contract Manager","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"supplierId","type":"uint256"}],"name":"payForElectricity","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"consumer","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"},{"internalType":"uint256","name":"consumption","type":"uint256"}],"name":"recordConsumerConsumptions","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"supplier","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"},{"internalType":"uint256","name":"production","type":"uint256"}],"name":"recordEnergyProductions","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"consumer","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"}],"name":"registerElectricityConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"oracleProvider","type":"address"}],"name":"registerOracleProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"supplier","type":"address"}],"name":"registerSupplier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"consumer","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"}],"name":"unRegisterElectricityConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"oracleProviderId","type":"uint256"}],"name":"unRegisterOracleProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"supplierId","type":"uint256"}],"name":"unRegisterSupplier","outputs":[],"stateMutability":"nonpayable","type":"function"}]
'''

main_address = '0x2a256cc5A4825eb251c68634f39b79C822955b3c'
contract = w3.eth.contract(address=Web3.to_checksum_address(main_address), abi=main_abi)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message:
        await update.message.reply_text('Hello! Use /set_private_key <private_key> to set your private key.')

user_private_keys = {}

async def set_private_key(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        user_id = update.effective_user.id
        private_key = context.args[0]
        user_private_keys[user_id] = private_key
        if update.message:
            await update.message.reply_text('Private key set successfully.')
    except IndexError:
        if update.message:
            await update.message.reply_text('Usage: /set_private_key <private_key>')
    except Exception as e:
        if update.message:
            await update.message.reply_text(f'Error: {str(e)}')

async def record_consumptions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        user_id = update.effective_user.id
        private_key = user_private_keys.get(user_id)
        if not private_key:
            if update.message:
                await update.message.reply_text('Please set your private key using /set_private_key <private_key> first.')
            return

        account = w3.eth.account.from_key(private_key)
        w3.eth.default_account = account.address

        args = context.args
        if len(args) < 3:
            if update.message:
                await update.message.reply_text('Usage: /record_consumptions <consumer> <supplierId> <consumption>')
            return
        
        consumer = Web3.to_checksum_address(args[0])
        supplier_id = int(args[1])
        consumption = int(args[2])
        
        tx_hash = send_transaction(contract.functions.recordConsumerConsumptions, account, private_key, consumer, supplier_id, consumption)

        if update.message:
            await update.message.reply_text(f'Transaction sent: {sepolia_scan_link + tx_hash.hex()}')
    except Exception as e:
        if update.message:
            await update.message.reply_text(f'Error: {str(e)}')

async def record_productions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        user_id = update.effective_user.id
        private_key = user_private_keys.get(user_id)
        if not private_key:
            if update.message:
                await update.message.reply_text('Please set your private key using /set_private_key <private_key> first.')
            return

        account = w3.eth.account.from_key(private_key)
        w3.eth.default_account = account.address

        args = context.args
        if len(args) < 3:
            if update.message:
                await update.message.reply_text('Usage: /record_productions <supplier> <supplierId> <production>')
            return

        supplier = Web3.to_checksum_address(args[0])
        supplier_id = int(args[1])
        production = int(args[2])

        tx_hash = send_transaction(contract.functions.recordEnergyProductions, account, private_key, supplier, supplier_id, production)

        if update.message:
            await update.message.reply_text(f'Transaction sent: {sepolia_scan_link + tx_hash.hex()}')
    except Exception as e:
        if update.message:
            await update.message.reply_text(f'Error: {str(e)}')

async def register_supplier(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        user_id = update.effective_user.id
        private_key = user_private_keys.get(user_id)
        if not private_key:
            if update.message:
                await update.message.reply_text('Please set your private key using /set_private_key <private_key> first.')
            return

        account = w3.eth.account.from_key(private_key)
        w3.eth.default_account = account.address

        supplier = Web3.to_checksum_address(context.args[0])

        tx_hash = send_transaction(contract.functions.registerSupplier, account, private_key, supplier)

        if update.message:
            await update.message.reply_text(f'Transaction sent: {sepolia_scan_link + tx_hash.hex()}')
    except IndexError:
        if update.message:
            await update.message.reply_text('Usage: /register_supplier <supplier>')
    except Exception as e:
        if update.message:
            await update.message.reply_text(f'Error: {str(e)}')

async def register_consumer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        user_id = update.effective_user.id
        private_key = user_private_keys.get(user_id)
        if not private_key:
            if update.message:
                await update.message.reply_text('Please set your private key using /set_private_key <private_key> first.')
            return

        account = w3.eth.account.from_key(private_key)
        w3.eth.default_account = account.address

        args = context.args
        if len(args) < 2:
            if update.message:
                await update.message.reply_text('Usage: /register_consumer <consumer> <supplierId>')
            return

        consumer = Web3.to_checksum_address(args[0])
        supplier_id = int(args[1])

        tx_hash = send_transaction(contract.functions.registerElectricityConsumer, account, private_key, consumer, supplier_id)
        
        if update.message:
            await update.message.reply_text(f'Transaction sent: {sepolia_scan_link + tx_hash.hex()}')
    except Exception as e:
        if update.message:
            await update.message.reply_text(f'Error: {str(e)}')

async def setup_commands(application):
    commands = [
        BotCommand("start", "Start the bot"),
        BotCommand("set_private_key", "Set your private key"),
        BotCommand("record_consumptions", "Record consumptions"),
        BotCommand("record_productions", "Record productions"),
        BotCommand("register_supplier", "Register as supplier"),
        BotCommand("register_consumer", "Register as consumer")
    ]
    await application.bot.set_my_commands(commands)

def send_transaction(function, account, private_key, *args):
    tx = function(*args).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return tx_hash

if __name__ == '__main__':
    # Initialize and run the Telegram bot
    application = ApplicationBuilder().token(os.getenv("TELEGRAM_TOKEN")).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("set_private_key", set_private_key))
    application.add_handler(CommandHandler("record_consumptions", record_consumptions))
    application.add_handler(CommandHandler("record_productions", record_productions))
    application.add_handler(CommandHandler("register_supplier", register_supplier))
    application.add_handler(CommandHandler("register_consumer", register_consumer))

    application.run_polling()