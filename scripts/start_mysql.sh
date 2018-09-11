find /var/lib/mysql/mysql -exec touch -c -a {} +
service mysql start
