<h1>Setup</h1>

Install dependencies

```
$ npm install @grpc/grpc-js @grpc/proto-loader pg readline-sync
```

Install postgres
```
$ brew install postgresql
```
Start db 

```
$ brew services start postgresql
```

Setup user
```
$ sudo useradd -m postgres
```

Setup database 
```
$ createdb chat
```

PSQL into chat database
```
$ psql chat
```


Setup tables in postgres by running following SQLs
```
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL
);
```
```
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender TEXT NOT NULL REFERENCES users(username),
    content TEXT NOT NULL,
    channel TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```
```
CREATE TABLE user_channels (
    user_id INTEGER REFERENCES users(id),
    channel TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, channel)
);
```
```
CREATE TABLE direct_messages (
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    content TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (sender_id, receiver_id, timestamp)
);
```

<h2>Reflections: </h2>
<h4>Language choice</h4>
I am not used to writing Typescript. This took some time to get into that mindset. Therefore, the code doesn't really hold the highest of standards. 
One example is Typescript types, I have forgotten how to easily write these and I chose to not spend time on relearning this. This is something I would like to have in the code to have strong types instead any casts. 

<h4>Tech choices</h4>
Postgresql I'm comfortable with. Things I would want to add is indecies for quicker lookups.

gRPC is new to me. It looks and feels a lot like kotlin Channels though. 

<h4>Missing features</h4>
DMs doesn't work properly. 


<h3>Time Spent: 4 hours-ish</h3>
1 hour-ish spent on researching, choosing and setting up tech stack.
3 hours-ish coding the server and client.
