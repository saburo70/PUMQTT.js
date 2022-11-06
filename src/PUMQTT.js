/*
 Author : F.Agosti
 Description : 
 A simple wrappe class for Paho MQTT client, designed to work in the browser
*/
//https://www.eclipse.org/paho/index.php?page=clients/python/docs/index.php
//https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Client.html
class PUMQTT {
    options =  {
        timeout: 3,
        keepAliveInterval: 30,
        reconnect : true
    };
    
    topicHandlers = {};

    subscriptions = [];
    
    //helper method to generate uuids
    static puUuid = (init) => {
        if (init) return init.substring(0, 1) + 'xxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        else
         return 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    //creates a client (does not connect)
    constructor(host, port, path, clientID) {
        if (location && (location.protocol == "https:")) this.options.useSSL = true;
        host = host || ((location) ? location.hostname : "127.0.0.1");
        this.clientID = clientID || ("client_"+PUMQTT.puUuid("m"));
        this.client = new   Paho.MQTT.Client(host, Number(port||15675), path || "/ws", this.clientID);
    }

    // connect to server, returns a promise
    connect(uname, upasswd) {
        if (uname && upasswd) {
            this.options.userName = uname;
            this.options.password = upasswd;
        }
        this.attemptConnect = true;
        return new Promise((resolve, reject) => {
            this.options.onSuccess = () => {
                this.options.onSuccess= ()=> { // prepare for reconnection
                    this.reSubscribe();
                }
                resolve(); 
            }
            this.options.onFailure = (err) => reject(err);
            this.client.connect(this.options);
            this.client.onMessageArrived = (message) => {     
                var topic = message.destinationName,
                    pars = {duplicate : message.duplicate, qos : message.qos,topic , retained : message.retained , raw : message.payloadBytes };
                if (Object.prototype.hasOwnProperty.call(this.topicHandlers,topic)) this.topicHandlers[topic](message.payloadString, pars );
                if (Object.prototype.hasOwnProperty.call(this.topicHandlers,"*")) this.topicHandlers["*"](message.payloadString, pars );            
            };
       
        });
    }

    //disconnects from server
    disconnect() {        
        delete this.attemptConnect;
        if (this.client.isConnected()) this.client.disconnect();
        return this;
    }

    isConnected= () => this.client.isConnected();

    setDisconnectedPublish(size) {
        if (size) 
            this.client.disconnectedBufferSize;
        if (size === false) this.client.disconnectedPublishing = false;
        else this.client.disconnectedPublishing = true;
        return this;
    } 

    setTopicHandler(topic, handler) {
         this.topicHandlers[topic] = handler;
         return this;
    }

    removeTopicHandler = (topic) => delete this.topicHandlers[topic];

    listTopicHandlers = () => Object.keys(this.topicHandlers);

    //subscribes to a topic and installsan eventual handler
    subscribe(topic, handler, qos) {
        //https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Message.html
        if (!this.client.isConnected()) return this;
        this.subscriptions.push(topic); //TODO: push object with options
        if (handler) this.setTopicHandler(topic, handler);
        qos = qos || 1; 
        return this.client.subscribe(topic, {qos});

    }
 
    promiseSubscribe(topic, handler, qos) {
        return new Promise((resolve, reject) => {
            if (!this.client.isConnected()) return reject();
            this.subscriptions.push(topic); //TODO: push object with options
            if (handler) this.setTopicHandler(topic, handler);
            qos = qos || 1; 
            this.client.subscribe(topic, {
                qos, 
                onSuccess : resolve,
                onFailure : reject
            });
        });   
    }

    reSubscribe() {        
        this.subscriptions.forEach( topic => this.subscribe(topic));
    }

    //unsubscribes from a topic and removes an eventual handler
    unsubscribe(topic, options) {
        if (this.subscriptions.includes(topic)) this.subscriptions.splice(this.subscriptions.indexOf(topic),1);        
        if (!this.client.isConnected()) return this;
        this.client.unsubscribe(topic, options);
        this.removeTopicHandler(topic);
        return this;
    }

    //removes all subscriptions
    unsubscribeAll(options) {
        this.subscriptions.forEach( topic => this.unsubscribe(topic, this.options));
    }

    //sends out a message, msg is a raw packed (string or ArrayBuffer)
    publish(topic, msg, qos, retained ) {
        if (!this.client.isConnected() && !this.client.disconnectedPublishing) return this;
        try {
            this.client.send(topic, msg, qos || 0 , retained || false);
        } catch (err) {
            console.warn("something went wrong sending out a message : ",err);
        }
        return this;
    }

    //sets the onCponnectionLost handler
   set onConnectionLost(val) {
        this.client.onConnectionLost = val;
    }  

    set onMessageDelivered(val) {
        this.client.onMessageDelivered = val;
    }

    setDeliveryHandler(handler){
        this.onMessageDelivered = handler;
        return this;
    }
    
    //attempts a reconnection every second
    //was used before the functionality wass implemented in Paho
    _reconnect() {
        if (this.attemptConnect && !this.client.isConnected()) {
            console.log("attem");
            this.options.onFailure = this._reconnect;
            var mq = this,
                cl = this.client,
                opts = JSON.parse(JSON.stringify(this.options)),
                valid ="timeout userName password willMessage keepAliveInterval cleanSession useSSL invocationContext onSuccess onFailure hosts ports mqttVersion reconnect".split(" ");
            Object.keys(opts).forEach( prop => { if (!valid.includes(prop)) delete opts[prop];});                
            setTimeout( () => {
                try {
                    cl.connect(opts);
                } catch (err) {
                    mq._reconnect();
                }
            }
            ,1000);
        }
    }

}