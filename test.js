const TypeUtils = require('data-type-utils');
const StatClient = require('./index');

const statClient1 = new StatClient("CPB", "CPBTest1", "CPB 1");   // use defaults of httpTimeoutMillis:20000, useStagingServer: false, useCompression: true
const statClient2 = new StatClient("CPB", "CPBTest2", "CPB 2", { httpTimeoutMillis : 1000, useStagingServer : 0, useCompression : 0 });

const pause = async function(pauseSecs) {
   if (TypeUtils.isPositiveInt(pauseSecs)) {
      return new Promise(function(resolve, reject) {
         try {
            console.log("Pausing for " + pauseSecs + " second(s)");
            setTimeout(resolve, 1000 * parseInt(pauseSecs));
         }
         catch (err) {
            reject(err);
         }
      });
   }
   else {
      return Promise.resolve();
   }
};

(async function() {
   console.log("Sending up");
   console.log(await statClient1.up("This is an up message (good for 10 seconds) for CPB 1 at " + new Date().toLocaleString(), null, 10));
   console.log(await statClient2.up("This is an up message (good for 15 seconds) for CPB 2 at " + new Date().toLocaleString(), null, 15));

   await pause(5);

   console.log("Sending debug");
   console.log(await statClient1.debug("This is a debug message"));
   console.log(await statClient2.debug("This is a debug message with some detail", "Look at these lovely details."));

   await pause(5);

   console.log("Sending info");
   console.log(await statClient1.info("This is an info message with some detail", "These details are amazing!"));
   console.log(await statClient2.info("This is an info message"));

   await pause(5);

   console.log("Sending warning");
   console.log(await statClient1.warning("Warning!", "Danger Will Robinson!"));
   console.log(await statClient2.warning("Warning!!!", "I'm running low on coffee!"));

   await pause(5);

   console.log("Sending critical");
   console.log(await statClient1.critical("OH NO!!!", "I'm lost!  In space!!!!"));
   console.log(await statClient2.critical("AAAAHHHH!!!", "We're all out of coffee!"));

   await pause(5);

   console.log("Sending down");
   console.log(await statClient1.down("Uh oh", "Game over."));
   console.log(await statClient2.down("Down", "I'm out, buying more coffee."));

   await pause(5);

   console.log("Sending up");
   console.log(await statClient1.up("Woohoo!", "I'm no longer lost, nor in space."));
   console.log(await statClient2.up("YES", "I'm back, with lots of coffee."));

   console.log("All done!");
})();