import os
from web3 import Web3, AsyncWeb3
from dotenv import load_dotenv

load_dotenv()

alchemyApiKey=os.getenv("ALCHEMY_API_KEY")

w3 = Web3(Web3.HTTPProvider('https://polygon-mumbai.g.alchemy.com/v2/'+alchemyApiKey))

abi = abi = '[{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"energyConsumptions","outputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"uint256","name":"consumption","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"}],"name":"getEnergyConsumption","outputs":[{"internalType":"uint256","name":"consumption","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"supplierId","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"uint256","name":"consumption","type":"uint256"}],"name":"recordEnergyConsumption","outputs":[],"stateMutability":"nonpayable","type":"function"}]'

oracleAddress = '0xB99B7a11B0e6BF8F0220f7C4E9Bd5BA37d195da5'
contract = w3.eth.contract(address=oracleAddress,abi=abi)

user = input('User address: ')
supplierId = int(input('Supplier ID: '))
idOfRecord = int(input('ID of record: '))

consumption = contract.functions.energyConsumptions(user,supplierId,idOfRecord).call()

print(consumption[1])