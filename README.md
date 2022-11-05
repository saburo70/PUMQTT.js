# PUMQTT.js
a wrapper class for Paho, to ease using MQTT in the browser


Paho is already quite easy to use,  ut I created this wrapper class for myself (cecause I am lazy :) ) to make things a bit more convenient for me.
Feel free to use it and to contribute.

The Eclipse Paho repositoy can be found here : https://github.com/eclipse/paho.mqtt.javascript

To test it I used rabbitMQ, the easiest way to set up a test local instance is to use Docker :

docker run -d --name rabbitmq -p 5672:5672 -p 5673:5673 -p 15672:15672 -p 1883:1883 -p 15675:15675 rabbitmq:3.8-management