# PUMQTT.js
a wrapper class for Paho, to ease using MQTT in the browser


Paho is already quite easy to use,  ut I created this wrapper class for myself (cecause I am lazy :) ) to make things a bit more convenient for me.
Feel free to use it and to contribute.

The Eclipse Paho repositoy can be found here : https://github.com/eclipse/paho.mqtt.javascript

To test it I used rabbitMQ, the easiest way to set up a test local instance is to use Docker :

docker run -d --name rabbitmq -p 5672:5672 -p 5673:5673 -p 15672:15672 -p 1883:1883 -p 15675:15675 rabbitmq:3.8-management

for it to work with websocket mqtt you must enable mqtt and qeb_mqtt plugins :

rabbitmq-plugins enable rabbitmq_mqtt
rabbitmq-plugins enable rabbitmq_web_mqtt

tcp mqtt runs by default on port 1883, while websocket mqtt runs from port 15675
You can use the guest user only from localhost, so if you are hosting your rabbitmq on a different address, you may need to create a second user and give it permissions
 