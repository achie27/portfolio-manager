# Installation

**A working demo is hosted here - ec2-54-218-121-24.us-west-2.compute.amazonaws.com:5000/**

1. Install the dependencies with -
```
npm i
```

2. Run the server with -
```
npm start
```
This will start `nodemon`, which works great during development and debugging. However, for production, it is better to use a process manager like `pm2`.


3. Access the API on -
```
http://localhost:5000/
```

# Design

- There are four entities in play here - `User`, `Holding`, `Portfolio`, and `Trade`
- New `User`s and `Holding`s can be added
- To create a `Portfolio` (or `Trade`) you need to be logged in as a `User`
- A `Portfolio` can only consist of those `Holding`s which are present in the `Holding` collection  
- One can get a `Portfolio`'s holdings/securities and returns
- `Trade`s can be done on a `Portfolio`, again only associating `Holding` collection
- A `Trade` can be deleted and updated wrt its type, price, or number of shares 

# Improvements

- Can use another API, like Alpha Vantage, for keeping track of holdings rather than using a collection. This would also eliminate the need to specify price for trades.
- Can use passport.js for authenticating users
- Can configure load balancing with sticky sessions on AWS 
- Can use Redis/Memcached to cache frequent stuff


# API Reference

## User

### Endpoint
```
POST /api/user/signup
```
**Parameters**
```
username : string, required
password : string, required
```
Signs up a user

### Endpoint
```
POST /api/user/login
```
**Parameters**
```
username : string, required
password : string, required
```
Logs in a user

### Endpoint
```
POST /api/user/logout
```
Logs out a user

### Endpoint
```
GET /api/user/portfolios
```
Retrieves all the portfolios owned/created by the user


## Holding

### Endpoint
```
POST /api/holding
```
**Parameters**
```
name : string
ticker : string, required
```
Creates a new holding

### Endpoint
```
GET /api/holding
```
Lists out all the holdings present

## Portfolio

### Endpoint
```
GET /api/portfolio/:id/returns
```
Returns returns

### Endpoint
```
GET /api/portfolio/:id/holdings
```
Gets all the holdings present in the portfolio

### Endpoint
```
GET /api/portfolio/:id
```
Gets all the info about portfolio `id`

### Endpoint
```
GET /api/portfolio
```
Retrieves all the portfolios and their info

### Endpoint
```
POST /api/portfolio/
```
**Parameters**
```
securities : [{
	holding : string, required	//ticker for holding 	
	avgBuyPrice : number, required
	shares : number, required
}]
```
Creates a portfolio with *securities* as its holdings. An empty portfolio can also be created.

## Trade

### Endpoint
```
GET /api/trade/:id
```
Gets info about trade `id`

### Endpoint
```
GET /api/trade
```
Gets info about all the trades done

### Endpoint
```
POST /api/trade
```
**Parameters**
```
type : string, required, [BUY, SELL]
price : number, required only if type is BUY
shares : number, required
holding : string, required 	// ticker
portfolioId : string, required
```
Creates a new trade in *portfolioId*

### Endpoint
```
PUT /api/trade/:id
```
**Parameters**
```
type : string, [BUY, SELL]
price : number
shares : number
```
Updates the trade id based on the parameter(s) provided

### Endpoint
```
DELETE /api/trade/:id
```

Deletes trade id
