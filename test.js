const TypeUtils = require('data-type-utils');
const StatClient = require('./index');

const statClient1 = new StatClient("CPB", "CPBTest1", "CPB 1", { httpTimeoutMillis : 1000, useStagingServer : 1, useCompression : 1 });
const statClient2 = new StatClient("CPB", "CPBTest2", "CPB 2", { httpTimeoutMillis : 1000, useStagingServer : 1, useCompression : 0 });

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
   await statClient1.up("This is an up message (good for 10 seconds) for CPB 1 at " + new Date().toLocaleString(), null, 10);
   await statClient2.up("This is an up message (good for 15 seconds) for CPB 2 at " + new Date().toLocaleString(), null, 15);

   await pause(5);

   console.log("Sending debug");
   await statClient1.debug("This is a debug message");
   await statClient2.debug("This is a debug message with some detail", "Look at these lovely details.");

   await pause(5);

   console.log("Sending info");
   await statClient1.info("This is an info message with some detail", "These details are amazing!");
   await statClient2.info("This is an info message");

   await pause(5);

   console.log("Sending warning");
   await statClient1.warning("Warning!", "Danger Will Robinson!");
   await statClient2.warning("Warning!!!", "I'm running low on coffee!");

   await pause(5);

   console.log("Sending critical");
   await statClient1.critical("OH NO!!!", "I'm lost!  In space!!!!");
   await statClient2.critical("AAAAHHHH!!!", "We're all out of coffee!");

   await pause(5);

   console.log("Sending down");
   await statClient1.down("Uh oh", "Game over.");
   await statClient2.down("Down", "I'm out, buying more coffee.");

   await pause(5);

   console.log("Sending up");
   await statClient1.up("Woohoo!", "I'm no longer lost, nor in space.");
   await statClient2.up("YES", "I'm back, with lots of coffee.");

   console.log("All done!");
})();