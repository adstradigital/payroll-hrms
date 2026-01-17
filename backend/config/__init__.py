# This ensures pymysql is loaded BEFORE Django tries to connect to MySQL
# Must be done here so it's executed when Django loads the config module
import pymysql

# Patch pymysql to work with Django 5+
# Django checks for mysqlclient version 2.2.1+, so we fake the version
pymysql.version_info = (2, 2, 4, "final", 0)
pymysql.__version__ = "2.2.4"

pymysql.install_as_MySQLdb()
