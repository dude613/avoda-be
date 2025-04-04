# Use the official PostgreSQL image
FROM postgres

# Optionally, copy any initialization scripts
# COPY ./init-db.sh /docker-entrypoint-initdb.d/

# Expose the default PostgreSQL port
EXPOSE 5432