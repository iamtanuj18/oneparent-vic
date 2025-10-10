# oneparent vic csv data import script
# imports all csv files from datasets folder into database tables
# handles data type conversion and error checking

param(
    [string]$DatabaseUrl,
    [string]$Password
)

write-host "oneparent vic - importing csv data to database" -foregroundcolor green
write-host "importing 13 tables from csv files..." -foregroundcolor yellow
write-host ""

# set database password
$env:PGPASSWORD = $Password

# import community schema data
write-host "importing community schema data..." -foregroundcolor cyan

write-host "  importing schools data (1,277 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy community.schools from '../../datasets/community_schools.csv' with csv header"

write-host "  importing languages by lga data (283 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy community.languages_lga from '../../datasets/community_languages_lga.csv' with csv header"

write-host "  importing council suburbs data (593 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy community.council_suburbs from '../../datasets/community_council_suburbs.csv' with csv header"

write-host "  importing rent and sale data (403 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy community.rent_sale from '../../datasets/community_rent_sale.csv' with csv header"

# import trends schema data
write-host ""
write-host "importing trends schema data..." -foregroundcolor cyan

write-host "  importing one parent families data (41 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy trends.victoria_one_parent_families from '../../datasets/trends_victoria_one_parent_families.csv' with csv header"

write-host "  importing labour families data (200 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy trends.victoria_labour_families from '../../datasets/trends_victoria_labour_families.csv' with csv header"

write-host "  importing pps by postcode data (3,511 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy trends.vic_pps_by_postcode from '../../datasets/trends_vic_pps_by_postcode.csv' with csv header"

write-host "  importing pps time series data (163 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy trends.pps_ts_data from '../../datasets/trends_pps_ts_data.csv' with csv header"

write-host "  importing pps with suburb data (676 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy trends.vic_pps_by_postcode_with_suburb from '../../datasets/trends_vic_pps_by_postcode_with_suburb.csv' with csv header"

# import hilda schema data
write-host ""
write-host "importing hilda schema data..." -foregroundcolor cyan

write-host "  importing childcare usage data (80 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy hilda.childcare_usage from '../../datasets/hilda_childcare_usage.csv' with csv header"

write-host "  importing mental health data (9 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy hilda.mental_health_recovery from '../../datasets/hilda_mental_health_recovery.csv' with csv header"

write-host "  importing housing stress data (44 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy hilda.housing_stress from '../../datasets/hilda_housing_stress.csv' with csv header"

# import vic_geo schema data
write-host ""
write-host "importing vic_geo schema data..." -foregroundcolor cyan

write-host "  importing suburb list data (3,161 records)..." -foregroundcolor white
psql $DatabaseUrl -c "\copy vic_geo.vic_suburb_list from '../../datasets/vic_geo_vic_suburb_list.csv' with csv header"

write-host ""
write-host "csv data import completed successfully" -foregroundcolor green
write-host "all 13 tables populated with data" -foregroundcolor green