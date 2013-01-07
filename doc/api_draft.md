#Api Draft
##Response
The Api response will be send in json with the following format.

	{
		"api_version" : "1",
		"status" : "200",
		"data" : {
			…
		}

	}
##1. Auth
Token based authentication that behaves like a session. All api request except the `getToken` method itself and `User/register` must contain a valid api token.



###1.1 Auth Methods
- ####getToken
expect: `username`, `password` (hashed)

	returns: `api_token`

- ####destroyToken
expect: `api_token`

##2. Api
User 
	-register
	-edit

Message 
	-send
	-create
	-archive

Friendfeed
	-update

Localfeed
	-post
	-update

post
	-create
	-delete
	-comment