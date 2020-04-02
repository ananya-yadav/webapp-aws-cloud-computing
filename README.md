# 
test a

This is a private repository . We have forked this repository to our personal accounts then create branches for assignments and then push the changes to the only master branch of the organization.
#### [Personal School GitHub Account](https://github.com/ananya-yadav)
#### Organization link -> https://github.com/yadavana-spring2020

#### Organization Repository Link -> https://github.com/yadavana-spring2020/webapp


#### Forked Repository on Personal GitHub Account Link -> https://github.com/ananya-yadav/webapp



#  Requirements
Install the following by reading installations section:-
+ Node.js and a node global package,
+ postgres, sequelize-cli,
+ mocha,
 + postman,
  + visual studio code 
   + dbeaver

# Installations

###  1. Node & npm


- ####  Node installation on Ubuntu


You can install nodejs and npm easily with apt install, just run the following commands.

```bash
$ sudo apt install nodejs

$ sudo apt install npm

```
- ####  Other Operating Systems

You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command on a terminal.
```bash
$ node --version

v10.15.3

$ npm --version

6.4.1
```

If you need to update `npm`, you can make it using `npm`!

```bash
$ npm install npm -g
```
### 2. Cloning the repository
---
**2.1. Go to the [Organization Repository Link](https://github.com/yadavana-spring2020/webapp)**
**2.2. Fork the repository to your personal GitHub**
**2.3. [Configure your system to connect to GitHub with SSH](https://help.github.com/en/articles/connecting-to-github-with-ssh)**
**2.4. Clone your forked repository using SSH**

``$ git clone https://github.com/YOUR_USERNAME/PROJECT_TITLE``

``$ cd PROJECT_TITLE``

``$ npm install``



## 3.2. Postgres installation on Ubuntu
Go to the [official website of postgres](https://www.postgresql.org/download/linux/ubuntu/) and download the Interactive installer

Once installed open a terminal and run the following steps
*3.2.1. Login through SuperUser*
 bash
``$ sudo -u postgres psql``

*3.2.2. Create a Database*
sql
``$ CREATE DATABASE cloudassignment;``


*3.2.3. See all Databases*
bash
``$ \list``


*3.2.4. Connect to our Database*
bash
``$ \c cloudassignment``

### 4. DBeaver
---

Download DBeaver Community Edition from it's [official download page](https://dbeaver.io/download/).

* Launch DBeaver. 
* Connect to PostgresSQL Database. 
* Provide the configs from the [config.json](https://github.com/yadavana-spring2020/webapp/blob/master/server/config/config.json) file and connect.

### 5. Sequelize
---

I'm  using Sequelize, which is a database [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) that will interface with the Postgres database for us.

So for all the migrations of the code to the database like creating tables, we need to install a sequeilize cli.
bash
``$ npm install -g sequelize-cli``

For migration:
bash
``$ sequelize db:migrate``

### 6. Mocha,Chai & Super-chai
---

[They]([http://developmentnow.com/2015/02/05/make-your-node-js-api-bulletproof-how-to-test-with-mocha-chai-and-supertest/](http://developmentnow.com/2015/02/05/make-your-node-js-api-bulletproof-how-to-test-with-mocha-chai-and-supertest/)) are the feature-rich JavaScript test frameworks running on Node.js and in the browser, making asynchronous testing simple and fun. IN this application we are using mocha . 

To install Mocha we have to :- 

``$ npm install -g mocha``

If you face permission issue, run this command :

  
``$ sudo npm install -g mocha``

### 7. Postman
---

[Postman](https://www.getpostman.com/) is a powerful tool for performing integration testing with your API. It allows for repeatable, reliable tests that can be automated and used in a variety of environments and includes useful tools for persisting data and simulating how a user might actually be interacting with the system.

Download Postman from it's [official website](https://www.getpostman.com/downloads/).

##  Running the application
```bash
$ npm start
```

##  Testing the application
```bash
$ npm test
```
