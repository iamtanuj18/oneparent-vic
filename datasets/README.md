# oneparent vic datasets - complete database export

this folder contains csv export files from the complete oneparent vic postgresql database. all data represents real demographic, geographic, and survey information for victoria australia.

## data overview

the database contains 13 tables across 4 schemas with comprehensive victorian family support data:

### total records: 10,238 rows
### total file size: approximately 400kb
### data freshness: exported from production database
### format: utf8 encoded csv files with headers

## file listing and descriptions

### community schema (4 tables)

**community_schools.csv** - 148.16kb - 1,277 records
- complete listing of victorian schools
- includes primary, secondary, and special schools
- location data with addresses and coordinates
- education sector classification (government, catholic, independent)
- use cases: school finder tools, demographic analysis by education access

**community_languages_lga.csv** - 9.93kb - 283 records  
- language diversity statistics by local government area
- non english languages spoken at home
- demographic composition data
- use cases: multicultural service planning, community outreach

**community_council_suburbs.csv** - 20.54kb - 593 records
- suburb to local government area mapping
- administrative boundary data
- council jurisdiction information  
- use cases: service delivery mapping, local government analytics

**community_rent_sale.csv** - 13.94kb - 403 records
- housing market data by suburb
- rental and sale price statistics
- affordability indicators
- use cases: housing stress analysis, family support targeting

### trends schema (5 tables)

**trends_victoria_one_parent_families.csv** - 1.75kb - 41 records
- single parent family statistics over time
- family composition trends by year
- demographic breakdown by family type
- use cases: policy development, trend analysis, service planning

**trends_victoria_labour_families.csv** - 8.31kb - 200 records
- family labor force participation data
- employment statistics by family type
- economic indicators for families
- use cases: employment support services, economic analysis

**trends_vic_pps_by_postcode.csv** - 97.55kb - 3,511 records
- postcode level demographic statistics
- population and family composition by postcode
- detailed geographic breakdown
- use cases: location based services, demographic mapping

**trends_pps_ts_data.csv** - 5.64kb - 163 records
- time series demographic data
- longitudinal population trends
- statistical modeling data
- use cases: forecasting, trend analysis, research

**trends_vic_pps_by_postcode_with_suburb.csv** - 22.91kb - 676 records
- enhanced postcode data with suburb names
- geographic reference data
- location mapping information
- use cases: address validation, location services

### hilda schema (3 tables)

**hilda_childcare_usage.csv** - 2.97kb - 80 records
- childcare utilization patterns from hilda survey
- family childcare usage statistics
- care arrangement preferences
- use cases: childcare policy, service planning

**hilda_mental_health_recovery.csv** - 0.65kb - 9 records  
- mental health recovery statistics
- wellbeing indicators for families
- recovery pathway data
- use cases: mental health services, family support programs

**hilda_housing_stress.csv** - 1.61kb - 44 records
- housing affordability stress indicators
- family housing burden statistics
- economic stress measures
- use cases: housing policy, family financial support

### vic_geo schema (1 table)

**vic_geo_vic_suburb_list.csv** - 47.91kb - 3,161 records
- complete victorian suburb listing
- geographic reference data
- location validation information
- use cases: address validation, location services, mapping

## data quality and characteristics

### data sources
- australian bureau of statistics census data
- department of education school listings
- hilda household income and labour dynamics survey
- victorian government administrative data

### data validation
- all records have been verified for completeness
- geographic coordinates validated against official sources
- statistical totals reconciled with published figures
- duplicate records removed and data cleaned

### encoding and format
- all files use utf8 character encoding
- csv format with comma separators
- headers included in first row
- text fields quoted where necessary
- null values represented as empty fields

## using the data

### importing into database
use the provided import scripts in aws/database folder:
```
.\import-csv-data.ps1
```

### direct csv analysis
files can be opened in excel, imported into r/python, or used with any csv processing tool

### database integration
schema definitions provided in create-schema.sql file
indexes and constraints included for performance
foreign key relationships maintained

### data privacy
all data represents aggregated statistics or public information
no personal identifying information included
data suitable for research and application development

## applications and use cases

### family support services
- identify high need areas using demographic data
- target services based on family composition
- analyze housing stress and support needs

### educational planning
- school capacity and accessibility analysis
- demographic planning for education services
- special needs service distribution

### policy development
- evidence based policy using longitudinal trends
- geographic service equity analysis
- demographic forecasting and planning

### research applications
- academic research on family demographics
- social policy effectiveness studies
- geographic and temporal trend analysis

### application development
- location based family support apps
- demographic visualization tools
- service finder applications

## data limitations

### temporal scope
data represents specific time periods and may not reflect current conditions
some datasets are more recent than others
trend data shows historical patterns but requires updating

### geographic scope
data specific to victoria australia
suburb and postcode references are victorian administrative boundaries
may not align with other state or national datasets

### completeness
some statistical categories may have small sample sizes
rural and remote areas may have limited data coverage
certain demographic groups may be underrepresented

## updating and maintenance

### data refresh
export scripts provided to update from source database
refresh frequency depends on source data update cycles
trend data typically updated annually

### quality assurance
verification scripts check data integrity
row counts and statistical totals validated
geographic references checked against official sources

### version control
csv files represent snapshot at export time
database schema may evolve with application requirements
backup and versioning recommended for production use

this dataset provides a comprehensive foundation for building family support applications, conducting demographic research, and developing evidence based social policies for victoria australia