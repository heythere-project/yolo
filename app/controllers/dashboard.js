function Dashboard(){}

Dashboard.prototype.index = function(){
	this.renderHTML("dashboard/index", {user : this.currentUser });
};

module.exports = Dashboard;