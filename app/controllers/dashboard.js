var Dashboard = Yolo.Controller.extend({
	index : function(){
		this.renderHTML("dashboard/index", {user : this.currentUser });
	}
});

module.exports = Dashboard;