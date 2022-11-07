# PUMQTT.js
a wrapper class for Paho, to ease using MQTT in the browser. Currently Paho js supports MQTT v3.1.1


Paho is already quite easy to use,  but I created this wrapper class for myself (cecause I am lazy :) ) to make things a bit more convenient for me.
Feel free to use it and to contribute.
The wrapper is Promise based and adds a bit of functionality to manage subscription handlers.

The Eclipse Paho repositoy can be found here : https://github.com/eclipse/paho.mqtt.javascript

To test it I used rabbitMQ, the easiest way to set up a test local instance is to use Docker :<br>
<code>
docker run -d --name rabbitmq -p 5672:5672 -p 5673:5673 -p 15672:15672 -p 1883:1883 -p 15675:15675 rabbitmq:3.8-management
</code>

should you prefer to install it on a VM (i.e. debian / ubuntu) , here some pointers : 

<code>
  apt-get install erlang
 </code><br>
 <code>
  apt-get install rabbitmq-server<br>  
  </code><br>
  <code>
  systemctl enable rabbitmq-server<br>  
  </code><br>
  <code>
  systemctl start rabbitmq-server<br>
</code><br>

for it to work with websocket mqtt you must enable <b>mqtt</b> and <b>web_mqtt</b> plugins :

<code>
rabbitmq-plugins enable rabbitmq_mqtt

rabbitmq-plugins enable rabbitmq_web_mqtt
</code> 

(if you inetalled yoursef, you may also want to enable the management and prometheus plugins) 
    
tcp mqtt runs by default on port 1883, while websocket mqtt runs from port 15675
You can use the guest user only from localhost, so if you are hosting your rabbitmq on a different address, you may need to create a second user and give it permissions
