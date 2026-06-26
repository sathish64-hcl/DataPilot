from routes_incident_command import (
    INCIDENT_DATABASE,
    INCIDENT_SCHEMA,
    _load_demo_data_to_snowflake,
    _verify_snowflake_tables,
)


def main():
    print(f"Loading incident demo data into Snowflake {INCIDENT_DATABASE}.{INCIDENT_SCHEMA}...")
    counts = _load_demo_data_to_snowflake()
    print("Loaded rows:")
    for table, count in counts.items():
        print(f"  {table}: {count}")
    print("Verified Snowflake row counts:")
    for table, count in _verify_snowflake_tables().items():
        print(f"  {table}: {count}")


if __name__ == "__main__":
    main()
