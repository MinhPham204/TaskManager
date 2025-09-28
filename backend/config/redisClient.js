const redis = require("redis");

// Create client with endpoint and password from redis
const redisClient = redis.createClient({
  socket: {
    host: "redis-15636.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com", 
    port: 15636, 
  },
  password: "0Q0sCyNZCt8FTUqsyFVRe6S185lXIrGn", 
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
  console.log("Connected to Redis Cloud");
})();

module.exports = redisClient;
