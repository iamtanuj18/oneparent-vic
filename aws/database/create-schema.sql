-- oneparent vic database schema creation
-- creates all schemas, tables, and structures for the application
-- run this after aws rds database is created

-- create application schemas
create schema if not exists community;
create schema if not exists hilda;
create schema if not exists trends;
create schema if not exists vic_geo;

-- set search path to include all schemas
set search_path to community, hilda, trends, vic_geo, public;

-- community schema tables
-- schools table - victorian schools directory with location data
create table if not exists community.schools (
    school_no integer,
    education_sector varchar(50),
    school_name varchar(200),
    school_type varchar(50),
    address_line_1 varchar(200),
    address_line_2 varchar(200),
    address_town varchar(100),
    address_postcode integer,
    phone varchar(50),
    lat real,
    lon real
);

-- languages by local government area
create table if not exists community.languages_lga (
    language varchar(100),
    council varchar(100),
    population integer
);

-- council to suburb mapping
create table if not exists community.council_suburbs (
    council varchar(100),
    suburb varchar(100),
    postcode varchar(10)
);

-- rental and sale prices by suburb
create table if not exists community.rent_sale (
    suburb varchar(100),
    rent_1bf integer,
    rent_2bf integer,
    rent_3bf integer,
    rent_2bh integer,
    rent_3bh integer,
    rent_4bh integer,
    rent_allprop real,
    buy_flat real,
    buy_house real
);

-- trends schema tables
-- single parent family statistics by year
create table if not exists trends.victoria_one_parent_families (
    year integer,
    state varchar(50),
    family_type varchar(100),
    total_families_thousands real,
    families_dependants_0_14_thousands real
);

-- labour force participation by family type
create table if not exists trends.victoria_labour_families (
    year integer,
    state varchar(50),
    family_type varchar(100),
    labour_force_status varchar(100),
    total_families_thousands real,
    families_with_children_0_14_thousands real
);

-- parenting payment single recipients by postcode
create table if not exists trends.vic_pps_by_postcode (
    postcode integer,
    long real,
    lat real,
    recipients integer
);

-- parenting payment single time series data
create table if not exists trends.pps_ts_data (
    date date,
    total_recipients integer,
    male_recipients integer,
    female_recipients integer,
    vic_recipients integer,
    recipients_without_earnings integer,
    recipients_with_earnings integer
);

-- parenting payment single by postcode with suburb names
create table if not exists trends.vic_pps_by_postcode_with_suburb (
    postcode integer,
    suburb varchar(100),
    long real,
    lat real,
    recipients integer
);

-- hilda schema tables (household income and labour dynamics)
-- childcare usage patterns
create table if not exists hilda.childcare_usage (
    period text,
    category text,
    subcategory text,
    measure text,
    value numeric,
    source_attribution text
);

-- mental health recovery data for single parents
create table if not exists hilda.mental_health_recovery (
    year_from_onset integer,
    single_parent_pct numeric,
    population_pct numeric,
    source_attribution text
);

-- housing stress by family type
create table if not exists hilda.housing_stress (
    year integer,
    family_type text,
    stress_pct numeric,
    source_attribution text
);

-- vic_geo schema tables
-- complete victorian suburb list
create table if not exists vic_geo.vic_suburb_list (
    id integer,
    suburb varchar(100)
);

-- create indexes for better query performance
-- community schema indexes
create index if not exists idx_schools_postcode on community.schools(address_postcode);
create index if not exists idx_schools_location on community.schools(lat, lon);
create index if not exists idx_languages_council on community.languages_lga(council);
create index if not exists idx_council_suburbs_suburb on community.council_suburbs(suburb);
create index if not exists idx_rent_sale_suburb on community.rent_sale(suburb);

-- trends schema indexes
create index if not exists idx_one_parent_year on trends.victoria_one_parent_families(year);
create index if not exists idx_labour_year on trends.victoria_labour_families(year);
create index if not exists idx_pps_postcode on trends.vic_pps_by_postcode(postcode);
create index if not exists idx_pps_location on trends.vic_pps_by_postcode(lat, long);
create index if not exists idx_pps_ts_date on trends.pps_ts_data(date);

-- hilda schema indexes
create index if not exists idx_childcare_category on hilda.childcare_usage(category);
create index if not exists idx_mental_health_year on hilda.mental_health_recovery(year_from_onset);
create index if not exists idx_housing_stress_year on hilda.housing_stress(year);

-- vic_geo schema indexes
create index if not exists idx_suburb_list_suburb on vic_geo.vic_suburb_list(suburb);

-- display completion message
select 'database schema created successfully' as status;
select 'all tables and indexes ready for data import' as next_step;