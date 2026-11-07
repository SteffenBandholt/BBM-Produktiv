// Compatibility path; one repository implementation in the shared package.
module.exports=require("../../../packages/family-host-ports/src/projectFirmsRepo.cjs").create({initDatabase: require("./database").initDatabase});
