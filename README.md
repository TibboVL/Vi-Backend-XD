# Vi Backend API

A backend service for Vi powered by Node.js, Express, and PostgreSQL.  

---

## 🚀 **Getting Started**

### **Prerequisites**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Node.js](https://nodejs.org/) 

---

## ⚙️ **Setup Guide**

1. **Start Database Services**  
   Navigate to project root and run:
   `docker compose up -d`
    This wil setup postgres and adminer(to view the db contents).

3. **Scaffhold database**
   Afterwards you can run 
   `npm run migrate:up`
   To initialize all tables and add in some data already.

## ⚙️ **Resetting database**
   If you need to make changes to the database structure you can use 
   `npm run migrate:down` 
   To drop all tables, and rebuild them using the up commmand.
