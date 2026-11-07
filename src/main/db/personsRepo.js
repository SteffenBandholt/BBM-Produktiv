module.exports=require("../../../packages/family-host-ports/src/personsRepo.cjs").create({initDatabase:(...args)=>require("./database").initDatabase(...args)});
