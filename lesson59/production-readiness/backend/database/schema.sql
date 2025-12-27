CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) UNIQUE NOT NULL,
    overall_score DECIMAL(5,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_checks (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) REFERENCES assessments(assessment_id),
    check_id VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    passed BOOLEAN NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    execution_time INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS check_findings (
    id SERIAL PRIMARY KEY,
    check_id VARCHAR(100) NOT NULL,
    assessment_id VARCHAR(255) NOT NULL,
    finding_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_timestamp ON assessments(created_at);
CREATE INDEX idx_checks_assessment ON assessment_checks(assessment_id);
