# WELLDONE Code Helper
* Using Lake Framework to parse a public key to associated account ids. Check the [docs](https://near-indexers.io/).

## How to start?
1. Install Dependencies
`yarn install`
2. Install [AWS CLI](https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/getting-started-install.html)
3. Inject AWS Credentials
```
~/.aws/credentials

[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## How to query?
* API PoC URI: `http://13.125.8.183/find/mainnet?public_key={public_key_string}`
  * Testnet: `http://13.125.8.183/find/testnet?public_key={public_key_string}`
* Example For Mainnet
  * Request URI Example: GET - Request your query by passing the public key of the account as a query string.
  `http://13.125.8.183/find/mainnet?public_key=ed25519:DvabrRhC1TKXG8hWTGG2U3Ra5E4YXAF1azHdwSc61fs9`
  * Response Body:
  ```
  {
    "status": 200,
    "network": "mainnet",
    "results": [
        {
            "address_id": "kendall.near"
        }
    ]
  }
  ```
  * Request URI Example
  `13.125.8.183/find/testnet?public_key=ed25519:CrxUCMVkBQMmY4xDRnqtm7qDmHPJ225QkXJEmx9K8QQL`
  * Response Body:
  ```
  {
    "status": 200,
    "network": "testnet",
    "results": [
        {
            "address_id": "oharthit2.testnet"
        }
    ]
  }
  ```