ndrew File System Visualization
##### Summary
This is a data collection and visualization tool for anyone with access to a unix based file server. Included in this repo is a shell script `run.sh` that uses `sshpass` to ssh into the file server of your choice, runs the [w command], and outputs the results of the command. Alongside it is a wrapper `main.py` which routinely calls `run.sh` on each of the six afs unix machines, parses the output and stores it into a table named `login_history` located in a database named `foo.db`. Each entry in `login_history` is structured as follows although one can choose to include more columns if they want to collect more data.
| id (INTEGER) | who (TEXT) | what (TEXT)               | time (DATETIME)     | serverid (INTEGER)|
| ------------ | ---------- | ------------------------- | ------------------- | ----------------- |
| 1            | 'foo'      | `--bash`                  | 2016-02-25 19:56:01 | 1                 |
| 2            | 'bar'      | `vim favorite_movies.txt` | 2016-02-25 19:56:03 | 6                 |

Include is a web/ folder which is a nodejs based website that visualizes foo.db in a couple of fun ways using D3.

## Usage
You can collect your own data if you have access to a unix based file server!
##### ./run.sh
First you must get `./run.sh` to work. In order to do so, you can use `sshpass` to automatically ssh into your chosen server. If your server allows long running background processes, then you don't need to use ssh, and you can simply run `w` on your server. Alternatively, you can set up a [ssh key].

Install `sshpass` and setup your environment variable `SSHPASS`: `export SSHPASS='yourpasswordhere'` then edit `run.sh` to use your own credentials and your own server address. Then try to run `./run.sh 1` to ssh into `unix1.andrew.cmu.edu` using your provided credentials or whatever server you choose to use. You should see a table of users currently logged into your server, when they logged in, what foreground process they are running, etc.

##### ./main.py

Now you can start collecting data. Provided is an empty foo.db database that is setup correctly. Run `./main.py` (you may have to install some dependencies and fiddle around with some variables), which will start to routinely ping your chosen server and save results into `login_history`.

### Visualization

Copy your filled `foo.db` into `web/public/foo.db` then run `node web/index.js` and open `localhost:5000` on your web browser and you can browse through some custome queries and their output visuals.


[w command]: http://www.computerhope.com/unix/w.htm 
[ssh key]: https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2
