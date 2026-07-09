1. Create express server refer-->app.js server.js
2. connect mongo db to server -- use mongodb atlas -- create new project , after project creation  cluster creation is to be done , remember the db user password, then select compass and copy the connection string , open the mongodb compass , new connection paste the uri u copied before and cluster is created 
3. Cluster is ready (further db will be created inside the cluster) now we have to connect the clusteer to server -- for this we need package "mongoose" and dotenv
4. create the .env file inside the src folder in which we will store all the secrete keys
5. create config folder inside it create db.js file 
6. in db.js file write the code to connect to database and export the function to use in server.js 
7. in server.js import the db.js function and call it 
8.  the server is connnected to the db 
9. now we will do authentication , create end points user can register login , additional functionalities like user is registered then an introductary email is sent to the user
10. user authentication for this we need to create user model / user schema for this we will create a models folder inside the src folder 
11. inside the models folder create user.model.js file to create user model / user schema 
12. user model is done now we will create api endpoints -- routes for register and login 
13. now we will create the routes folder inside it we will create the auth.routes.js file in this we will create the authenticatiion routes one will be for user registration and anohter will be for login user 
14. routes are created inside the routes folder inside the route files but the controllers are created in a seperate folder with seperate file for auth -- auth.controller.js
15. in the controller file we require the user model and write a function which will register the user refer auth.controller.js

now after registering the user we will give the user a jwt token which will keep the user logged in on the website

Core Answer: In the backend, you keep users logged in by validating the JWT on every incoming request and implementing a Refresh Token strategy so the user doesn't have to re-login when the main token expires.
The Interview Cheat Sheet
    1. The Request Flow (Per-Request Validation)
    Extraction: The backend extracts the JWT from the Authorization: Bearer <token> header or an HttpOnly cookie.

    Verification: The backend verifies the digital signature using a secret key and checks the exp (expiration) timestamp
    
    Context: If valid, the backend decodes the payload (e.g., user_id) and attaches it to the request object to allow access.

2. Session Persistence (Access vs. Refresh Tokens)
    Access Token: Short-lived (e.g., 15 minutes). Used for stateless API authentication.
    Refresh Token: Long-lived (e.g., 7 days). Stored securely on the backend database/Redis.
    The Silent Refresh: When the access token expires, the client calls a /refresh endpoint with the refresh token. The backend validates it and issues a new short-lived access token, keeping the user logged in seamlessly

for creating the token we need to install jsonwebtoken
in auth.controller.js after creating the user we will create token , we have to use jwt.sign() , payload is given as user's id and jwt secret which will be generated online via jwt secrets website and will be stored in .env file as jwt_secret 

now token is created now we have to set the token in the cookies
for this we need package "cookie-parser" 

Status code 201 is used because it explicitly confirms that the request succeeded and resulted in the successful creation of a new resource (the user) on the server.

now after both the routes for login and register is done , testing is also done using postman

Now we will create a functionality if a user registers then a welcome email is to be sent automatically to the user

for this we will use "nodemailer" , we dont have a company email address , so we will use a temp email address dont use private email address.

nodemailer gives the power to the express's server to send  mail to any particular mail id

go to ankur prajapati's repo in that search for "difference-backend-video" repo in that documnetation to integrate different technologies is provided.

now copyt the emai.js code and create a new folder named "services" inside it create "email.service.js" paste the email.js code 


Simple Mail Transfer Protocol (SMTP): The universal web standard/protocol used to push emails across networks.

A Nodemailer transporter acts as an internal HTTP-to-SMTP translator. It takes your local JavaScript email data, establishes an encrypted TCP handshake with an external SMTP server (e.g., Google's), authenticates your identity via OAuth2, and instructs that server to route the message to the recipient's email provider.

after complete setup of email.service.js , come to auth.controller.js immport the exported function from email.service.js and use it after response sent in the registeration controller function

now we will move towards creating bank accounts model for users because one user can have multiple bank accounts  

A ledger is basically a record of every transaction that happens. Think of it like a detailed logbook. Instead of just storing a final balance, you record every time money goes in or out. When you want to know the balance, you add up all those transactions. So, a ledger gives you a full history rather than just one number.

now after model is created for accounts we need to create some apis which will create the accounts and which will fetch all the accounts for a particular user

to optimize it -- one user can have multiple accounts 
so Indexing is used to speed up searches. By indexing the user field, the database quickly finds all accounts belonging to a specific user, making queries faster.

now we will create the routes for accounts and use it in app.js 

now we have to crete the controller file account.controller.js  in that the function will be there where user will give some data and account will be created of that particular user but before this we need to immplement the middleware to check the authenticatiion status of the user 

role of middleware -- to check whether the user is logged in or not and any request which is coming from a particular user is a valid logged user in or not

to check this the token given while the user registration controller was return we gave the user a token stored in the coookies / req.headers.authorization , so we will check the request whether there is the token present in the cookies or not , if yes then verify its right or not and if its not there then user is not logged in so no access  

In the auth middleware, the JWT token contains only the user ID. After verifying the token, we use the ID to fetch the full user from the database, ensuring we have complete user details. We attach this user to the request so the next steps have full access. Calling "next" then passes control to the next middleware or controller in the chain.

now use the middleware in the account.routes.js create protected api for account creation and use the middleware in that api

now designing the account controller -- now we need to think what all things are required to create account with the help of account  


abhi banking system kaise work karta hai wo dekhenge

Idempotency is a property of an operation where performing it multiple times has the same effect as performing it just once. In a banking system, for example, a transaction is idempotent if, even if the request is sent multiple times, the final result—such as the total balance—remains the same as if it had been applied only once. This ensures consistency and prevents duplicate or accidental operations.

create a transcation maintaining the from user , to user, amount to be transferred , Idempotency key xyz which is a string and unique for a transaction , status which is kept default as pending 

now comes the role of ledger which is like a register system like in a account what money was credited and what was debited 
for every transaction there will be 2 ledger entries one in source account , another in destination account and in transaction the status is marked as complete

now we have to create a model for transaction create transaction.model.js