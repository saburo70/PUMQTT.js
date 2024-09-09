/*
 Author : F.Agosti
 Description : 
 A simple wrappe class for Paho MQTT client, designed to work in the browser
*/
//https://www.eclipse.org/paho/index.php?page=clients/python/docs/index.php
//https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Client.html
/* global Paho */

class PUMQTT {
    options =  {
        timeout: 3,
        keepAliveInterval: 30,
        reconnect : true
    };
    
    identifier = null;
    identifierBytes = 0;

    topicHandlers = {};

    subscriptions = [];
    
    //helper method to generate uuids
    static puUuid = (init) => {
        init = (init || '').substring(0,4);
        return init + 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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

    setIdentifier(ident) {
        if (ident == null) ident = '';
        this.identifier = ident;
        this.identifierBytes = ident.length;
        return this;
    }

     muteSender(ident) {
         if (!this.mutedSenders) this.mutedSenders=[];
         if (this.mutedSenders.indexOf(ident)==-1) this.mutedSenders.push(ident);
         return this;
     }
     
     unMuteSender(ident) {
         if (!this.mutedSenders) return this;
         var idx = this.mutedSenders.indexOf(ident);
         if (idx!=-1) this.mutedSenders.splice(idx,1);
         if (this.mutedSenders.length==0) delete this.mutedSenders;
         return this;
     }
     
     filterMeOut() {
         if (this.identifier) this.muteSender(this.identifier);
         return this;
     }

    // connect to server, returns a promise
    connect(uname, upasswd) {
        if (uname && upasswd) {
            this.options.userName = uname;
            this.options.password = upasswd;
        }
        this.options.useSSL = true;
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
                    pars = {duplicate : message.duplicate, qos : message.qos,topic , retained : message.retained , raw : message.payloadBytes },
                    msgTxt = message.payloadString;
                if (this.identifierBytes>0) {
                    pars.sender = message.payloadString.substring(0,4);
                    if (pars.sender == this.identifier) pars.self = true;
                    if (this.mutedSenders && (this.mutedSendes.indexOf(pars.sender)>=0)) return; // muted
                    msgTxt = message.payloadString.substring(4);
                }    else msgTxt = message.payloadString;
                if (Object.prototype.hasOwnProperty.call(this.topicHandlers,topic)) this.topicHandlers[topic](msgTxt, pars );
                    if (Object.prototype.hasOwnProperty.call(this.topicHandlers,"*")) this.topicHandlers["*"](msgTxt, pars );
            };
       
        });
        return this;
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

    clearRetained(topic) {
        this.publish(topic,"",0,true);
    }


    //subscribes to a topic and installs an eventual handler
    subscribe(topic, handler, qos) {
        //https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Message.html
        //https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Client.html
        if (!this.client.isConnected()) return this;
        this.subscriptions.push(topic); //TODO: push object with options
        if (handler) this.setTopicHandler(topic, handler);
        qos = qos || 1; 
        this.client.subscribe(topic, {qos});
        return this;
    }
 
    promiseSubscribe(topic, handler, qos) {
        return new Promise((resolve, reject) => {
            if (!this.client.isConnected()) return reject("not connected");
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

    //returns a promise and overwrites onSuccess and onFailure in the options , if present
    promiseUnsubscribe(topic, options) {
        var ob = this;
        return new Promise((resolve, reject) => {
            if (!ob.client.isConnected()) return reject();
            options = options || {};
            options.onSuccess = resolve;
            options.onFailure = reject;
            ob.removeTopicHandler(topic);
            ob.client.unsubscribe(topic, options);                        
        });   
    }

   //removes all subscriptions
    unsubscribeAll(options) {
        this.subscriptions.forEach( topic => this.unsubscribe(topic, this.options));
    }

    //sends out a message, msg is a raw packed (string or ArrayBuffer)
    publish(topic, msg, qos, retained ) {
        if (!this.client.isConnected() && !this.client.disconnectedPublishing) return this;
        try {
            if (this.identifierBytes>0) msg = this.identifier + msg;
            var message = new Paho.MQTT.Message(msg);
            message.destinationName = topic;
            message.qos = qos || 2;
             message.retained = retained || false;
            this.client.send(message);
            
            //this.client.send(topic, msg, qos || 2 , retained || false);
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
