-- oneparent vic database verification script
-- checks that all tables have been created and populated correctly
-- displays row counts and sample data for verification

-- check all schemas exist
select 'checking database schemas...' as status;
select schema_name 
from information_schema.schemata 
where schema_name in ('community', 'hilda', 'trends', 'vic_geo')
order by schema_name;

-- check table row counts
select 'verifying table row counts...' as status;

select 
    'community.schools' as table_name, 
    count(*) as row_count,
    'expected: 1277' as expected
from community.schools
union all
select 
    'community.languages_lga', 
    count(*),
    'expected: 283'
from community.languages_lga
union all
select 
    'community.council_suburbs', 
    count(*),
    'expected: 593'
from community.council_suburbs
union all
select 
    'community.rent_sale', 
    count(*),
    'expected: 403'
from community.rent_sale
union all
select 
    'trends.victoria_one_parent_families', 
    count(*),
    'expected: 41'
from trends.victoria_one_parent_families
union all
select 
    'trends.victoria_labour_families', 
    count(*),
    'expected: 200'
from trends.victoria_labour_families
union all
select 
    'trends.vic_pps_by_postcode', 
    count(*),
    'expected: 3511'
from trends.vic_pps_by_postcode
union all
select 
    'trends.pps_ts_data', 
    count(*),
    'expected: 163'
from trends.pps_ts_data
union all
select 
    'trends.vic_pps_by_postcode_with_suburb', 
    count(*),
    'expected: 676'
from trends.vic_pps_by_postcode_with_suburb
union all
select 
    'hilda.childcare_usage', 
    count(*),
    'expected: 80'
from hilda.childcare_usage
union all
select 
    'hilda.mental_health_recovery', 
    count(*),
    'expected: 9'
from hilda.mental_health_recovery
union all
select 
    'hilda.housing_stress', 
    count(*),
    'expected: 44'
from hilda.housing_stress
union all
select 
    'vic_geo.vic_suburb_list', 
    count(*),
    'expected: 3161'
from vic_geo.vic_suburb_list;

-- sample data verification
select 'checking sample data...' as status;

-- check schools data
select 'community.schools sample:' as table_name;
select school_name, address_town, education_sector
from community.schools 
limit 3;

-- check trends data
select 'trends.victoria_one_parent_families sample:' as table_name;
select year, family_type, total_families_thousands
from trends.victoria_one_parent_families 
order by year desc
limit 3;

-- check geographic data
select 'vic_geo.vic_suburb_list sample:' as table_name;
select suburb
from vic_geo.vic_suburb_list 
limit 5;

-- final verification message
select 'database verification completed' as status;
select 'if all row counts match expected values, your database is ready' as result;