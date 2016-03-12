#!/usr/bin/python2.7

import subprocess, string, mysql.connector, urllib2

_SERVER_NUM_LOW = 1
_SERVER_NUM_HIGH = 6
_BASH_SCRIPT = "./run.sh" 
_SUBPROCESS_TIMEOUT_SECONDS = 10

_QUERY_SAVE_HISTORY = ("INSERT INTO login_history"
	  "(serverid, who, what)"
	  "VALUES (%s, %s, %s)")

_QUERY_INSERT_USER_TABLE = ("INSERT INTO users"
		"(who, department, affiliation, studentLevel, studentClass)"
		" VALUES (%(who)s, %(department)s, %(affiliation)s, %(studentLevel)s, %(studentClass)s)")

_QUERY_UPDATE_USER_TABLE = "SELECT * FROM users WHERE who = %s"


_DB_CONFIG = {"user":"cwei",
	      			"password":"password",
              "host":"localhost",
              "database":"afsdb"}

_ANDREW_LOOKUP_GET = ("http://apis.scottylabs.org/directory/v1/{}/odb")


def get_user_data(andrewid):
	get = _ANDREW_LOOKUP_GET.format(andrewid)
	print get
	response = urllib2.urlopen(get).read()
	print response
	return None


def update_user_table(connection, andrewid):
	cursor = connection.cursor()
	cursor.execute(_QUERY_UPDATE_USER_TABLE, [andrewid])
	cursor.fetchall()
	if (cursor.rowcount == 0):
		userdata = get_user_data(andrewid)
		cursor.execute(_QUERY_INSERT_USER_TABLE, userdata)
		connection.commit()
	cursor.close()



def process_output(connection, servernum, output):
	if (len(output) == 0):
		print "No values detected for server #" + str(servernum)
		return
	lines = string.split(output, '\n')
	data = []
	for line in lines:
		entry = string.split(line, None, 3)
		if (len(entry) < 4): break
		andrewid = entry[0]
		what = entry[3]
		data.append((str(servernum), andrewid, what));

	print "Inserting " + str(len(data)) + " lines"

	cursor = connection.cursor()
	cursor.executemany(_QUERY_SAVE_HISTORY, data)
	connection.commit()
	cursor.close()

def retrieve_and_process(connection):
	output = [""] * 6
	for i in xrange(_SERVER_NUM_LOW, _SERVER_NUM_HIGH+1):
		print "Hitting UNIX" + str(i)
		output[i-1] = subprocess.check_output([_BASH_SCRIPT, str(i)])
	for i in xrange(_SERVER_NUM_LOW, _SERVER_NUM_HIGH+1):
		print "Processing UNIX" + str(i)
		process_output(connection, i, output[i-1])

def begin():
	#TODO: add a scheduler
	connection = mysql.connector.connect(**_DB_CONFIG)
	retrieve_and_process(connection)
	connection.close()


if (__name__ == '__main__'):
	begin()
