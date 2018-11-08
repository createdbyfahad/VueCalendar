# VueCalendar:

VueCalendar is a single page application built using Vue.js for events managing. It allows users to add/edit/delete events from a web-based calendar. 
View one Week (7 days) at a time and can freely jump to any future date. Uses [MongoDB](https://docs.mongodb.com/)
to store events, and is able to create a backup in the form of a textfile.
A python flask server is used to host and control the how the application functions.  

## Screenshots
<p>
<img src="https://user-images.githubusercontent.com/37724969/48177071-c9fd7380-e2c7-11e8-9e4d-40c3738ab17c.png" width="275" alt="VueCalendar sc1">
<img src="https://user-images.githubusercontent.com/37724969/48177072-c9fd7380-e2c7-11e8-9f4d-1584a06699e0.png" width="275" alt="VueCalendar sc2">
<img src="https://user-images.githubusercontent.com/37724969/48177070-c9fd7380-e2c7-11e8-8472-62b9d1e47ff0.png" width="275" alt="VueCalendar sc3">
</p>

## Authors:

Fahad Alarefi - Front end development

Benjamin Michalisko - Backend development

James Narayana Emery - Database callbacks


## Getting started:

These instructions will tell you how to get a copy of the project and running the 
calendar on your local machine. These instructions are based on unix-like 
operating systems. You should ask your package manager to install if you do not have
authority.

### Prerequisites:  

Required to install and run the software:

 * [python3](https://www.python.org/)
 * [python3-venv](https://docs.python.org/3/tutorial/venv.html)

#### Installing Prerequisites:  

##### MACOS:  

You need to install [homebrew](https://brew.sh/) first. If you already have homebrew 
on your machine, you can skip step 1.  

```
1. /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)".  
2. brew insatll python3
3. pip3 install virtualenv 
```
		
##### Ubuntu:
```  
1. sudo apt-get install python3
2. sudo apt-get install python3-venv  
```
##### Fedora: 
``` 
sudo yum install python36  
```

 Python3.4+ include the venv module on Fedora.  


### Requirements:

This is a list of requirements for the python virtual environment. These are not required to be
manually installed, as they will be installed when you run `make install` or `make run` command.

* [click 6.7](http://click.pocoo.org/6/)
* [flask 0.12.2](http://flask.pocoo.org/)
* [gunicorn 19.7.1](http://gunicorn.org/)
* [itsdangerous 0.24](https://pythonhosted.org/itsdangerous/)
* [Jinja2 2.10](http://jinja.pocoo.org/docs/2.10/)
* [MarkupSafe 1.0](https://pypi.org/project/MarkupSafe/)
* [pymongo 3.6.1](https://api.mongodb.com/python/current/)
* [python-dateutil 2.7.2](https://dateutil.readthedocs.io/en/stable/)
* [six 1.11.0](https://pypi.org/project/six/)
* [Werkzeug 0.14.1](http://werkzeug.pocoo.org/)  
* [nose](http://nose.readthedocs.io/en/latest/)  
* pkg-resources 0.0.0  

### How to Run:

	1. Update necessary database information in source/credentials.ini.example and change name to credentials.ini
	2. cd to the directory which contians Makefile
	3. make install
	4. make run
	5. Open the address/port listed in either the terminal or the Credentials.ini
	6. Ctrl+C to quit  

### How to Remove:
	1. make clean
	2. make veryclean  
`make clean` should leave the project ready to run, while `make veryclean` may leave project 
in a state that requires re-running installation and configuration steps. 


## Acknowledgment:

1. [Mogodb Collection Doc](https://docs.mongodb.com/manual/reference/method/js-collection/)
2. Inspired by Google Calendar

