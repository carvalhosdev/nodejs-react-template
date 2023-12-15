# NODEJS WITH REACT 18 - STARTER BOILERPLATE

Project is on development, updates soon:
 
![](https://geps.dev/progress/75)

## SERVER

### Database File Configuration
npx prisma init --datasource-provider sqlite or postgresql

*postgresql - https://customer.elephantsql.com/login*

Next steps:
1. Set the DATABASE_URL in the .env file to point to your existing database. If your database has no tables yet, read https://pris.ly/d/getting-started
2. Run prisma db pull to turn your database schema into a Prisma schema.
3. Run prisma generate to generate the Prisma Client. You can then start querying your database.

npx prisma generate

npx prisma db push

npx prisma studio

### SSL configuration
*If the cert not work, use this inside of cert folder:*

- openssl genrsa -out key.pem
- openssl req -new -key key.pem -out csr.pem
- openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

*Chrome Localhost Cert - chrome://flags/ *

Search for

*Allow invalid certificates for resources loaded from localhost*


### Routes
*npm run dev*

- https://localhost:8080
- https://localhost:8080/auth/signup
- https://localhost:8080/auth/login
- https://localhost:8080/auth/me
- https://localhost:8080/private-test



# CLIENT
*npm run dev*

This project starts with tailwind.css
