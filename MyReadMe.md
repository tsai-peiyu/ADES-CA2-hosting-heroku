Class: DIT/2B/02

Group members:
1. Tsai Pei Yu 1935389
2. Lynette Jean Tay 1922561
3. Tan Jia Xin Vanessa 1949843


Set up database:
1. Go to https://www.elephantsql.com/ and sign up for an account.
2. Create an instance in elephantSQL

    a. plan: tiny turtle
    
    b. datacenter: Amazon Web Services AP-East-1 (Hong Kong)
    
3. Change the connectionString in database.js which can be found in the project folder, to your own instance URL (select instance > details) so that you can connect to ur instance.
4. In the elephantSQL browser tab, execute the following sql statements:

------- to create companyQueue -------

DROP TABLE IF EXISTS companyQueue;

CREATE TABLE companyQueue (
    
    queue_id CHAR(10) UNIQUE NOT NULL,
    
    company_id BIGINT CONSTRAINT TenDigits CHECK (company_id BETWEEN 1000000000 and 9999999999),
    
    status VARCHAR(40) NOT NULL,
    
    PRIMARY KEY ( queue_id )
    
);


------- to create companyQueue -------

DROP TABLE IF EXISTS customerQueue;

CREATE TABLE customerQueue (
    
    customer_id BIGINT CONSTRAINT TenDigits CHECK (customer_id BETWEEN 1000000000 and 9999999999),
    
    fk_queue_id CHAR(10) NOT NULL,
    
    timestamp INT NOT NULL DEFAULT extract(epoch from now()),
    
    FOREIGN KEY ( fk_queue_id ) REFERENCES companyqueue(queue_id),
    
    CONSTRAINT joinQueue UNIQUE (customer_id, fk_queue_id)
    
);

You have now successfully set up your database ! 
