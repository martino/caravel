# This script completes the conversion of a caravel database from sqlite to postgres
# by generating a sql file to run in the destination database.
# before running this a postgres database must be created and pgloader must be run to import the data

import argparse

table_ts = {
    'ab_register_user': ['registration_date'],
    'ab_user': ['created_on', 'changed_on', 'last_login'],
    'clusters': ['created_on', 'changed_on', 'metadata_last_refreshed'],
    'columns': ['created_on', 'changed_on'],
    'css_templates': ['created_on', 'changed_on'],
    'dashboards': ['created_on', 'changed_on'],
    'datasources': ['created_on', 'changed_on'],
    'dbs': ['created_on', 'changed_on'],
    'favstar': ['dttm'],
    'logs': ['dttm'],
    'slices': ['created_on', 'changed_on'],
    'sql_metrics': ['created_on', 'changed_on'],
    'table_columns': ['created_on', 'changed_on'],
    'tables': ['created_on', 'changed_on'],
    'url': ['created_on', 'changed_on']
}

tables = [
    'ab_permission',
    'ab_permission_view',
    'ab_permission_view_role',
    'ab_register_user',
    'ab_role',
    'ab_user',
    'ab_user_role',
    'ab_view_menu',
    'alembic_version',
    'clusters',
    'columns',
    'css_templates',
    'dashboard_slices',
    'dashboard_user',
    'dashboards',
    'datasources',
    'dbs',
    'favstar',
    'logs',
    'metrics',
    'slice_user',
    'slices',
    'sql_metrics',
    'table_columns',
    'tables',
    'url'
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output_file", type=str, default="out.sql")
    parser.add_argument("--pg-user", type=str, default="postgres")
    args = parser.parse_args()

    with open(args.output_file, 'w') as f:
        for table in tables:
            f.write("-" * 10 + table + "-" * 10)
            f.write("\n")
            f.write("create sequence {table}_id_seq;".format(table=table))
            f.write("\n")
            f.write("alter table {table} alter column id set not null;".format(table=table))
            f.write("\n")
            f.write("alter table {table} alter column id set default nextval('{table}_id_seq');".format(table=table))
            f.write("\n")
            f.write("select setval('{table}_id_seq', (select max(id) from {table}));".format(table=table))
            f.write("\n")
            f.write("alter sequence {table}_id_seq owner to {pg_user};".format(table=table, pg_user=args.pg_user))
            f.write("\n")
            f.write("alter sequence {table}_id_seq owned by {table}.id;".format(table=table))
            f.write("\n")
            if table in table_ts:
                cols = table_ts[table]
                for col in cols:
                    f.write("alter table {} alter column {} type timestamp;\n".format(table, col))
            f.write("\n")


if __name__ == '__main__':
    main()
