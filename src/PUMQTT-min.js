class PUMQTT{options={timeout:3,keepAliveInterval:30,reconnect:!0};topicHandlers={};subscriptions=[];static puUuid=t=>t?t.substring(0,1)+"xxxxxxxxxxxxxxx".replace(/[xy]/g,(function(t){var e=16*Math.random()|0;return("x"==t?e:3&e|8).toString(16)})):"xxxxxxxxxxxxxxxx".replace(/[xy]/g,(function(t){var e=16*Math.random()|0;return("x"==t?e:3&e|8).toString(16)}));constructor(t,e,i,s){location&&"https:"==location.protocol&&(this.options.useSSL=!0),t=t||(location?location.hostname:"127.0.0.1"),this.clientID=s||"client_"+PUMQTT.puUuid("m"),this.client=new Paho.MQTT.Client(t,Number(e||15675),i||"/ws",this.clientID)}connect(t,e){return t&&e&&(this.options.userName=t,this.options.password=e),this.attemptConnect=!0,new Promise(((t,e)=>{this.options.onSuccess=()=>{this.options.onSuccess=()=>{this.reSubscribe()},t()},this.options.onFailure=t=>e(t),this.client.connect(this.options),this.client.onMessageArrived=t=>{var e=t.destinationName,i={duplicate:t.duplicate,qos:t.qos,topic:e,retained:t.retained,raw:t.payloadBytes};Object.prototype.hasOwnProperty.call(this.topicHandlers,e)&&this.topicHandlers[e](t.payloadString,i),Object.prototype.hasOwnProperty.call(this.topicHandlers,"*")&&this.topicHandlers["*"](t.payloadString,i)}}))}disconnect(){return delete this.attemptConnect,this.client.isConnected()&&this.client.disconnect(),this}isConnected=()=>this.client.isConnected();setDisconnectedPublish(t){return t&&this.client.disconnectedBufferSize,this.client.disconnectedPublishing=!1!==t,this}setTopicHandler(t,e){return this.topicHandlers[t]=e,this}removeTopicHandler=t=>delete this.topicHandlers[t];listTopicHandlers=()=>Object.keys(this.topicHandlers);subscribe(t,e,i){return this.client.isConnected()?(this.subscriptions.push(t),e&&this.setTopicHandler(t,e),i=i||1,this.client.subscribe(t,{qos:i})):this}promiseSubscribe(t,e,i){return new Promise(((s,n)=>{if(!this.client.isConnected())return n();this.subscriptions.push(t),e&&this.setTopicHandler(t,e),i=i||1,this.client.subscribe(t,{qos:i,onSuccess:s,onFailure:n})}))}reSubscribe(){this.subscriptions.forEach((t=>this.subscribe(t)))}unsubscribe(t,e){return this.subscriptions.includes(t)&&this.subscriptions.splice(this.subscriptions.indexOf(t),1),this.client.isConnected()?(this.client.unsubscribe(t,e),this.removeTopicHandler(t),this):this}promiseUnsubscribe(t,e){var i=this;return new Promise(((s,n)=>{if(!i.client.isConnected())return n();(e=e||{}).onSuccess=s,e.onFailure=n,i.removeTopicHandler(t),i.client.unsubscribe(t,e)}))}unsubscribeAll(t){this.subscriptions.forEach((t=>this.unsubscribe(t,this.options)))}publish(t,e,i,s){if(!this.client.isConnected()&&!this.client.disconnectedPublishing)return this;try{this.client.send(t,e,i||0,s||!1)}catch(t){}return this}set onConnectionLost(t){this.client.onConnectionLost=t}set onMessageDelivered(t){this.client.onMessageDelivered=t}setDeliveryHandler(t){return this.onMessageDelivered=t,this}_reconnect(){if(this.attemptConnect&&!this.client.isConnected()){this.options.onFailure=this._reconnect;var t=this,e=this.client,i=JSON.parse(JSON.stringify(this.options)),s="timeout userName password willMessage keepAliveInterval cleanSession useSSL invocationContext onSuccess onFailure hosts ports mqttVersion reconnect".split(" ");Object.keys(i).forEach((t=>{s.includes(t)||delete i[t]})),setTimeout((()=>{try{e.connect(i)}catch(e){t._reconnect()}}),1e3)}}}