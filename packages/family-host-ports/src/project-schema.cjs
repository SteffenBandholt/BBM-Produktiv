exports.freshSql=`    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,

      project_number TEXT,

      name TEXT NOT NULL,

      short TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      project_lead TEXT,
      project_lead_phone TEXT,
      start_date TEXT,
      geplanter_baubeginn TEXT,
      bauherr_firm_kind TEXT,
      bauherr_firm_id TEXT,
      end_date TEXT,
      notes TEXT,

      archived_at TEXT
    );`;
