-- =====================================================================
-- CSDL: Website quản lý tuyển dụng & theo dõi hồ sơ ứng tuyển
-- DBMS: MySQL 8.0+ (InnoDB, utf8mb4)
-- Phủ các sub-task [DB] của Story 12, 15-45 trong Jira
-- =====================================================================

DROP DATABASE IF EXISTS recruitment;
CREATE DATABASE recruitment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE recruitment;

-- =====================================================================
-- EP2. ĐĂNG NHẬP & PHÂN QUYỀN  (Story 15, 16, 17, 18)
-- =====================================================================

CREATE TABLE roles (
    id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code        VARCHAR(20)  NOT NULL,              -- CANDIDATE | RECRUITER | ADMIN
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB;

CREATE TABLE users (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_id           TINYINT UNSIGNED NOT NULL,
    email             VARCHAR(255) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(150) NOT NULL,
    is_active         TINYINT(1)   NOT NULL DEFAULT 1,   -- Admin khóa / mở (Story 43)
    email_verified_at DATETIME     NULL,
    last_login_at     DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role_active (role_id, is_active),
    KEY idx_users_name (full_name),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB;

CREATE TABLE email_verification_tokens (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64)  NOT NULL,                  -- SHA-256 của token
    expires_at DATETIME  NOT NULL,
    used_at    DATETIME  NULL,
    created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_evt_token (token_hash),
    KEY idx_evt_user (user_id),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64)  NOT NULL,
    expires_at DATETIME  NOT NULL,                  -- có hạn dùng
    used_at    DATETIME  NULL,                      -- dùng một lần
    created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_prt_token (token_hash),
    KEY idx_prt_user (user_id),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64)  NOT NULL,
    user_agent VARCHAR(255) NULL,
    ip_address VARCHAR(45)  NULL,
    expires_at DATETIME  NOT NULL,
    revoked_at DATETIME  NULL,
    created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_token (token_hash),
    KEY idx_rt_user (user_id, revoked_at),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ghi nhận mỗi lần đăng nhập để khóa tạm khi sai nhiều lần
CREATE TABLE login_attempts (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    user_id    BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45)  NULL,
    is_success TINYINT(1)   NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_la_email_time (email, created_at),
    KEY idx_la_ip_time (ip_address, created_at),
    CONSTRAINT fk_la_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- EP3. HỒ SƠ ỨNG VIÊN  (Story 19, 20, 21)
-- =====================================================================

CREATE TABLE candidate_profiles (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NOT NULL,
    phone         VARCHAR(20)  NULL,
    address       VARCHAR(255) NULL,
    date_of_birth DATE         NULL,
    gender        ENUM('MALE','FEMALE','OTHER') NULL,
    avatar_url    VARCHAR(500) NULL,
    headline      VARCHAR(150) NULL,               -- vd: "Backend Developer"
    summary       TEXT         NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cp_user (user_id),
    CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE educations (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    profile_id  BIGINT UNSIGNED NOT NULL,
    school      VARCHAR(200) NOT NULL,
    degree      VARCHAR(150) NULL,
    major       VARCHAR(150) NULL,
    start_date  DATE NULL,
    end_date    DATE NULL,
    description TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_edu_profile (profile_id),
    CONSTRAINT fk_edu_profile FOREIGN KEY (profile_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_edu_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE experiences (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    profile_id  BIGINT UNSIGNED NOT NULL,
    company     VARCHAR(200) NOT NULL,
    position    VARCHAR(150) NOT NULL,
    start_date  DATE NULL,
    end_date    DATE NULL,                          -- NULL = đang làm
    description TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_exp_profile (profile_id),
    CONSTRAINT fk_exp_profile FOREIGN KEY (profile_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_exp_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE skills (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    profile_id BIGINT UNSIGNED NOT NULL,
    name       VARCHAR(100) NOT NULL,
    level      ENUM('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT') NOT NULL DEFAULT 'INTERMEDIATE',
    PRIMARY KEY (id),
    UNIQUE KEY uq_skill_profile_name (profile_id, name),
    CONSTRAINT fk_skill_profile FOREIGN KEY (profile_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE candidate_cvs (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    candidate_id BIGINT UNSIGNED NOT NULL,          -- users.id của ứng viên
    name         VARCHAR(200) NOT NULL,
    file_path    VARCHAR(500) NOT NULL,
    mime_type    VARCHAR(100) NOT NULL,             -- application/pdf, .docx
    file_size    INT UNSIGNED NOT NULL,             -- bytes
    is_default   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cv_candidate (candidate_id, is_default),
    CONSTRAINT fk_cv_candidate FOREIGN KEY (candidate_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- Danh mục dùng chung: ngành nghề, địa điểm  (Story 44)
-- =====================================================================

CREATE TABLE categories (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name      VARCHAR(120) NOT NULL,
    slug      VARCHAR(140) NOT NULL,
    is_active TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cat_name (name),
    UNIQUE KEY uq_cat_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE locations (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name      VARCHAR(120) NOT NULL,                -- Tỉnh / thành phố
    slug      VARCHAR(140) NOT NULL,
    is_active TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_loc_name (name),
    UNIQUE KEY uq_loc_slug (slug)
) ENGINE=InnoDB;

-- =====================================================================
-- EP4. NHÀ TUYỂN DỤNG & TIN TUYỂN DỤNG  (Story 22-26)
-- =====================================================================

CREATE TABLE companies (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_id    BIGINT UNSIGNED NOT NULL,           -- users.id (RECRUITER)
    name        VARCHAR(200) NOT NULL,
    logo_url    VARCHAR(500) NULL,
    description TEXT         NULL,
    address     VARCHAR(255) NULL,
    website     VARCHAR(255) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_company_owner (owner_id),
    KEY idx_company_name (name),
    CONSTRAINT fk_company_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE jobs (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_id   BIGINT UNSIGNED NOT NULL,
    category_id  INT UNSIGNED    NOT NULL,
    location_id  INT UNSIGNED    NOT NULL,
    title        VARCHAR(200)    NOT NULL,
    description  TEXT            NOT NULL,
    benefits     TEXT            NULL,
    salary_min   INT UNSIGNED    NULL,
    salary_max   INT UNSIGNED    NULL,
    job_type     ENUM('FULL_TIME','PART_TIME','INTERN','CONTRACT','FREELANCE') NOT NULL DEFAULT 'FULL_TIME',
    quantity     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    deadline     DATE            NOT NULL,          -- hạn nộp hồ sơ
    status       ENUM('DRAFT','PENDING','APPROVED','REJECTED','HIDDEN','CLOSED') NOT NULL DEFAULT 'DRAFT',
    view_count   INT UNSIGNED    NOT NULL DEFAULT 0,
    published_at DATETIME        NULL,
    closed_at    DATETIME        NULL,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_jobs_company_status (company_id, status),
    KEY idx_jobs_list (status, created_at),                       -- Story 27
    KEY idx_jobs_filter (category_id, location_id, status),       -- Story 29
    KEY idx_jobs_salary (salary_min, salary_max),
    KEY idx_jobs_deadline (status, deadline),                     -- Story 37
    FULLTEXT KEY ft_jobs_search (title, description),             -- Story 28
    CONSTRAINT fk_jobs_company  FOREIGN KEY (company_id)  REFERENCES companies  (id) ON DELETE CASCADE,
    CONSTRAINT fk_jobs_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_jobs_location FOREIGN KEY (location_id) REFERENCES locations  (id),
    CONSTRAINT chk_jobs_salary  CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min),
    CONSTRAINT chk_jobs_quantity CHECK (quantity >= 1)
) ENGINE=InnoDB;

CREATE TABLE job_positions (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    job_id     BIGINT UNSIGNED NOT NULL,
    title      VARCHAR(200) NOT NULL,
    quantity   SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_jp_job (job_id, sort_order),
    CONSTRAINT fk_jp_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE job_requirements (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    job_id      BIGINT UNSIGNED NOT NULL,
    position_id BIGINT UNSIGNED NULL,               -- NULL = áp dụng cho cả tin
    type        ENUM('SKILL','EXPERIENCE','DEGREE','LANGUAGE','OTHER') NOT NULL,
    content     VARCHAR(500) NOT NULL,
    is_required TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_jr_job (job_id, sort_order),
    KEY idx_jr_position (position_id),
    CONSTRAINT fk_jr_job      FOREIGN KEY (job_id)      REFERENCES jobs (id)          ON DELETE CASCADE,
    CONSTRAINT fk_jr_position FOREIGN KEY (position_id) REFERENCES job_positions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lịch sử duyệt tin của Admin
CREATE TABLE job_moderation (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    job_id      BIGINT UNSIGNED NOT NULL,
    reviewer_id BIGINT UNSIGNED NULL,               -- Admin
    status      ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    reason      VARCHAR(500) NULL,                  -- lý do từ chối
    reviewed_at DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_jm_job (job_id, created_at),
    KEY idx_jm_status (status, created_at),
    CONSTRAINT fk_jm_job      FOREIGN KEY (job_id)      REFERENCES jobs (id)  ON DELETE CASCADE,
    CONSTRAINT fk_jm_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Báo cáo vi phạm tin tuyển dụng (Story 45)
CREATE TABLE job_reports (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    job_id      BIGINT UNSIGNED NOT NULL,
    reporter_id BIGINT UNSIGNED NULL,
    reason      VARCHAR(500) NOT NULL,
    status      ENUM('OPEN','RESOLVED','DISMISSED') NOT NULL DEFAULT 'OPEN',
    handled_by  BIGINT UNSIGNED NULL,
    handled_at  DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_jrep_job (job_id),
    KEY idx_jrep_status (status, created_at),
    CONSTRAINT fk_jrep_job      FOREIGN KEY (job_id)      REFERENCES jobs (id)  ON DELETE CASCADE,
    CONSTRAINT fk_jrep_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_jrep_handler  FOREIGN KEY (handled_by)  REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- EP6. ỨNG TUYỂN & THEO DÕI TRẠNG THÁI  (Story 31-35)
-- =====================================================================

CREATE TABLE applications (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    job_id           BIGINT UNSIGNED NOT NULL,
    candidate_id     BIGINT UNSIGNED NOT NULL,      -- users.id
    cv_id            BIGINT UNSIGNED NULL,          -- CV gốc (có thể bị xóa sau)
    cv_snapshot_path VARCHAR(500) NOT NULL,         -- bản sao CV tại thời điểm nộp
    cover_letter     TEXT         NULL,
    status           ENUM('SUBMITTED','VIEWED','INTERVIEW','HIRED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    note             VARCHAR(1000) NULL,            -- ghi chú của nhà tuyển dụng
    reject_reason    VARCHAR(500)  NULL,
    applied_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_app_job_candidate (job_id, candidate_id),       -- chặn nộp trùng
    KEY idx_app_job_status (job_id, status, applied_at),          -- Story 34
    KEY idx_app_candidate (candidate_id, applied_at),             -- Story 32
    KEY idx_app_status_time (status, applied_at),                 -- Story 38
    CONSTRAINT fk_app_job       FOREIGN KEY (job_id)       REFERENCES jobs (id)           ON DELETE CASCADE,
    CONSTRAINT fk_app_candidate FOREIGN KEY (candidate_id) REFERENCES users (id)          ON DELETE CASCADE,
    CONSTRAINT fk_app_cv        FOREIGN KEY (cv_id)        REFERENCES candidate_cvs (id)  ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE application_status_history (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id BIGINT UNSIGNED NOT NULL,
    from_status    VARCHAR(20)  NULL,
    to_status      VARCHAR(20)  NOT NULL,
    changed_by     BIGINT UNSIGNED NULL,
    note           VARCHAR(1000) NULL,
    changed_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ash_app (application_id, changed_at),
    CONSTRAINT fk_ash_app FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
    CONSTRAINT fk_ash_by  FOREIGN KEY (changed_by)     REFERENCES users (id)        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- EP7. THÔNG BÁO & CẢNH BÁO  (Story 36-39)
-- =====================================================================

CREATE TABLE notifications (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    type       ENUM('APPLICATION_STATUS','NEW_APPLICATION','APPLICATION_PENDING',
                    'JOB_EXPIRING','JOB_APPROVED','JOB_REJECTED','SYSTEM') NOT NULL,
    title      VARCHAR(200) NOT NULL,
    content    VARCHAR(1000) NULL,
    ref_type   VARCHAR(30)  NULL,                   -- 'JOB' | 'APPLICATION'
    ref_id     BIGINT UNSIGNED NULL,
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_noti_user (user_id, is_read, created_at),
    -- dùng cho cron job kiểm tra đã cảnh báo đối tượng này chưa (tránh gửi trùng)
    KEY idx_noti_ref (type, ref_type, ref_id, created_at),
    CONSTRAINT fk_noti_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- EP8. VIEW THỐNG KÊ  (Story 38, 40, 41)
-- =====================================================================

-- Tin sắp hết hạn trong 7 ngày (Story 37)
CREATE VIEW v_jobs_expiring_soon AS
SELECT j.id AS job_id, j.title, j.company_id, c.owner_id AS recruiter_id,
       j.deadline, DATEDIFF(j.deadline, CURDATE()) AS days_left
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.status = 'APPROVED'
  AND j.deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);

-- Hồ sơ chưa xử lý quá 3 ngày (Story 38)
CREATE VIEW v_applications_pending AS
SELECT a.id AS application_id, a.job_id, j.title AS job_title,
       c.owner_id AS recruiter_id, a.applied_at,
       DATEDIFF(NOW(), a.applied_at) AS days_waiting
FROM applications a
JOIN jobs j      ON j.id = a.job_id
JOIN companies c ON c.id = j.company_id
WHERE a.status IN ('SUBMITTED','VIEWED')
  AND a.applied_at < DATE_SUB(NOW(), INTERVAL 3 DAY);

-- Thống kê theo nhà tuyển dụng (Story 40)
CREATE VIEW v_recruiter_stats AS
SELECT c.owner_id AS recruiter_id,
       COUNT(DISTINCT j.id)                                              AS total_jobs,
       COUNT(DISTINCT CASE WHEN j.status = 'APPROVED' THEN j.id END)     AS active_jobs,
       COUNT(a.id)                                                       AS total_applications,
       SUM(a.status = 'SUBMITTED')                                       AS cnt_submitted,
       SUM(a.status = 'VIEWED')                                          AS cnt_viewed,
       SUM(a.status = 'INTERVIEW')                                       AS cnt_interview,
       SUM(a.status = 'HIRED')                                           AS cnt_hired,
       SUM(a.status = 'REJECTED')                                        AS cnt_rejected,
       ROUND(100 * SUM(a.status = 'HIRED') / NULLIF(COUNT(a.id), 0), 2)  AS hired_rate_pct
FROM companies c
LEFT JOIN jobs j         ON j.company_id = c.id
LEFT JOIN applications a ON a.job_id = j.id
GROUP BY c.owner_id;

-- Thống kê theo ngành nghề, dùng cho dashboard Admin (Story 41)
CREATE VIEW v_category_stats AS
SELECT cat.id AS category_id, cat.name AS category_name,
       COUNT(DISTINCT j.id) AS total_jobs,
       COUNT(a.id)          AS total_applications,
       SUM(a.status = 'HIRED') AS total_hired
FROM categories cat
LEFT JOIN jobs j         ON j.category_id = cat.id
LEFT JOIN applications a ON a.job_id = j.id
GROUP BY cat.id, cat.name;

-- Tổng quan toàn hệ thống (Story 41)
CREATE VIEW v_admin_overview AS
SELECT
  (SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'CANDIDATE') AS total_candidates,
  (SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'RECRUITER') AS total_recruiters,
  (SELECT COUNT(*) FROM jobs)                                    AS total_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'PENDING')           AS jobs_pending_review,
  (SELECT COUNT(*) FROM jobs WHERE status = 'APPROVED')          AS jobs_active,
  (SELECT COUNT(*) FROM applications)                            AS total_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'HIRED')     AS total_hired,
  (SELECT COUNT(*) FROM job_reports WHERE status = 'OPEN')       AS open_reports;

-- =====================================================================
-- DỮ LIỆU KHỞI TẠO (seed)
-- =====================================================================

INSERT INTO roles (code, name, description) VALUES
 ('CANDIDATE', 'Ứng viên',        'Tìm việc, nộp hồ sơ, theo dõi trạng thái'),
 ('RECRUITER', 'Nhà tuyển dụng',  'Đăng tin, xử lý hồ sơ ứng tuyển'),
 ('ADMIN',     'Quản trị viên',   'Quản lý người dùng, duyệt tin, danh mục, thống kê');

INSERT INTO categories (name, slug) VALUES
 ('Công nghệ thông tin',       'cong-nghe-thong-tin'),
 ('Kinh doanh / Bán hàng',     'kinh-doanh-ban-hang'),
 ('Marketing / Truyền thông',  'marketing-truyen-thong'),
 ('Kế toán / Kiểm toán',       'ke-toan-kiem-toan'),
 ('Nhân sự / Hành chính',      'nhan-su-hanh-chinh'),
 ('Thiết kế / Sáng tạo',       'thiet-ke-sang-tao'),
 ('Giáo dục / Đào tạo',        'giao-duc-dao-tao'),
 ('Sản xuất / Kỹ thuật',       'san-xuat-ky-thuat'),
 ('Y tế / Dược',               'y-te-duoc'),
 ('Khác',                      'khac');

INSERT INTO locations (name, slug) VALUES
 ('Hà Nội',        'ha-noi'),
 ('TP. Hồ Chí Minh','tp-ho-chi-minh'),
 ('Đà Nẵng',       'da-nang'),
 ('Hải Phòng',     'hai-phong'),
 ('Cần Thơ',       'can-tho'),
 ('Huế',           'hue'),
 ('Bình Dương',    'binh-duong'),
 ('Đồng Nai',      'dong-nai'),
 ('Remote',        'remote'),
 ('Khác',          'khac');

-- Tài khoản Admin mặc định. ĐỔI mật khẩu và thay bằng hash thật (bcrypt/argon2) trước khi dùng.
INSERT INTO users (role_id, email, password_hash, full_name, is_active, email_verified_at)
SELECT id, 'admin@example.com', '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH', 'System Admin', 1, NOW()
FROM roles WHERE code = 'ADMIN';
