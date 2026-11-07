"use strict";
const registry=require('./module-registry.json');
function ensureSchema(db,{projectKey="id",createProjects=false}={}) {
 if(createProjects){if(projectKey!=="id")throw Error('Existing BBMi project table required');db.exec(require('./project-schema.cjs').freshSql);}
 require('./schema.cjs').ensureProjectColumns(db);
 if(!db.prepare('PRAGMA table_info(projects)').all().some(c=>c.name==='meeting_series_mask'))db.exec('ALTER TABLE projects ADD COLUMN meeting_series_mask INTEGER NOT NULL DEFAULT 1 CHECK(meeting_series_mask BETWEEN 0 AND 7)');
 const s=require('./schema.cjs').create({projectKey});
 s.ensureFirmsAndPersonsSchema(db);s.ensureProjectGlobalFirmsSchema(db);s.ensureProjectFirmsAndPersonsSchema(db);
 require('./firmUsagesRepo.cjs').create({initDatabase:()=>db}).ensureFirmUsagesSchema(db);
}
function createRepositories({getDb,projectKey="id",projects}) {
 const deps={initDatabase:getDb,projectKey};
 const firms=require('./firmsRepo.cjs').create(deps),persons=require('./personsRepo.cjs').create(deps);
 const projectFirms=require('./projectFirmsRepo.cjs').create(deps),projectPersons=require('./projectPersonsRepo.cjs').create(deps),usages=require('./firmUsagesRepo.cjs').create(deps);
 const {FirmDirectoryService}=require('./FirmDirectoryService.cjs').create({initDatabase:getDb,firmsRepo:firms,projectFirmsRepo:projectFirms,firmUsagesRepo:usages});
 const builder=require('./projectBuilder.cjs').create({FirmDirectoryService});
 const projectRepo=projects||require('./projectsRepo.cjs').create({initDatabase:getDb,...require('./meetingSeries.cjs'),...builder,firmUsagesRepo:usages,...require('./firmReference.cjs')});
 return {projects:projectRepo,firms,persons,projectFirms,projectPersons,usages,builder,directory:new FirmDirectoryService({dbProvider:getDb})};
}
module.exports={ensureSchema,createRepositories,registry,createLicenseVerifier:require('./licenseVerifier.cjs').create};
