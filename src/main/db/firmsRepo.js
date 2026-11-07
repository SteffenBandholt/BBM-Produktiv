// Compatibility path; one repository implementation in the shared package.
module.exports=require("../../../packages/family-host-ports/src/firmsRepo.cjs").create({initDatabase: (...args)=>require("./database").initDatabase(...args)});
