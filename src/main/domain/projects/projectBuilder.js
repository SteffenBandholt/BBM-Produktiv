// Compatibility path; one repository implementation in the shared package.
module.exports=require("../../../../packages/family-host-ports/src/projectBuilder.cjs").create({FirmDirectoryService:require("../firms/FirmDirectoryService").FirmDirectoryService});
