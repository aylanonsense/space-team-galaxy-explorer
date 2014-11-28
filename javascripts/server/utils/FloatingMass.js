if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
], function(
) {
	function FloatingMass(x, y, facing, mass, radius) {
		this.pos = { x: x || 0, y: y || 0 };
		this.vel = { x: 0 , y: 0, rotational: 0 };
		this.acc = { x: 0 , y: 0, rotational: 0 };
		this._forces = { x: 0 , y: 0, forward: 0, lateral: 0, rotational: 0 };
		this.facing = facing || 0; //0: right, PI/2: up, PI: left, -PI/2: down
		this.mass = mass || 1;
		this.radius = radius || 1;
		this._momentOfInertia = this.mass * this.radius * this.radius / 2; //assume a cylinder
		this.friction = 0;
		this.rotationalFriction = 0;
		this._startPos = null;
		this._endPos = null;
		this._timeOfCurrentFrame = 0;
	}
	FloatingMass.prototype.applyForce = function(x, y, rotational) {
		this._forces.x += x;
		this._forces.y += y;
		this._forces.rotational += rotational;
	};
	FloatingMass.prototype.applyForceRelativeToFacing = function(forward, lateral, rotational) {
		this._forces.forward += forward;
		this._forces.lateral += lateral;
		this._forces.rotational += rotational;
	};
	FloatingMass.prototype.planMovement = function(t) {
		//convert force into acceleration
		var forceForward = this._forces.forward;
		var forceLateral = this._forces.lateral;
		var forceRotational = this._forces.rotational;
		var forceX = Math.cos(this.facing) * forceForward - Math.sin(this.facing) * forceLateral + this._forces.x;
		var forceY = Math.sin(this.facing) * forceForward + Math.cos(this.facing) * forceLateral + this._forces.y;
		this.acc = {
			x: forceX / this.mass,
			y: forceY / this.mass,
			rotational: forceRotational / this._momentOfInertia
		};

		//reset forces
		this._forces = { x: 0 , y: 0, forward: 0, lateral: 0, rotational: 0 };

		//adjust velocity and facing
		var friction = (this.friction > 0 ? Math.pow(Math.E, -this.friction * t) : 1.00);
		this.vel.x = (this.vel.x + this.acc.x * t) * friction;
		this.vel.y = (this.vel.y + this.acc.y * t) * friction;
		var rotationalFriction = (this.rotationalFriction > 0 ? Math.pow(Math.E, this.rotationalFriction * t) : 1.00);
		this.vel.rotational = (this.vel.rotational + this.acc.rotational * t) * rotationalFriction;
		this.facing += this.vel.rotational * t;

		//keep facing between PI and -PI
		if(this.facing > Math.PI) {
			this.facing = this.facing % (2 * Math.PI);
			if(this.facing > Math.PI) { this.facing -= 2 * Math.PI; }
		}
		else if(this.facing <= -Math.PI) {
			this.facing = this.facing % (2 * Math.PI);
			if(this.facing <= -Math.PI) { this.facing += 2 * Math.PI; }
		}

		//record start (current) and end positions
		this._startPos = { x: this.pos.x, y: this.pos.y };
		this._endPos = { x: this.pos.x + this.vel.x * t, y: this.pos.y + this.vel.y * t };
		this._timeOfCurrentFrame = t;
	};
	FloatingMass.prototype.checkForCollison = function(other) {
		var offset = { x: this._endPos.x - this._startPos.x, y: this._endPos.y - this._startPos.y };

		//reduce problem to a circle and a line
		var circle = { x: this._startPos.x, y: this._startPos.y, radius: this.radius + other.radius };
		var line = {
			start: { x: other._startPos.x, y: other._startPos.y },
			end: { x: other._endPos.x - offset.x, y: other._endPos.y - offset.y }
		};

		//check to see if the line is colliding with the circle

		return false;
	};
	FloatingMass.prototype.adjustTrajectory = function(collision) {
		//find angle between onjects
		var distXToOther = collision.otherPos.x - collision.selfPos.y;
		var distYToOther = collision.otherPos.y - collision.selfPos.y;
		var angle = Math.atan2(distYToOther, distXToOther);

		//calculate rotated velocities
		var selfVelTowards = this.vel.x * Math.cos(angle) + this.vel.y * Math.sin(angle);
		var selfVelPerpendicular = this.vel.x * Math.sin(angle) - this.vel.y * Math.cos(angle);
		var otherVelTowards = collision.other.vel.x * Math.cos(angle) + collision.other.vel.y * Math.sin(angle);
		var otherVelPerpendicular = collision.other.vel.x * Math.sin(angle) - collision.other.vel.y * Math.cos(angle);

		//exchange momentum due to collision
		var newSelfVelTowards = TODO;
		var newOtherVelTowards = TODO;

		//unrotate and apply velocities
		this.vel.x = newSelfVelTowards * Math.___(angle) + selfVelPerpendicular * Math.___(angle);
		this.vel.y = newSelfVelTowards * Math.___(angle) + selfVelPerpendicular * Math.___(angle);
		collision.other.vel.x = newOtherVelTowards * Math.___(angle) + OtherVelPerpendicular * Math.___(angle);
		collision.other.vel.y = newOtherVelTowards * Math.___(angle) + OtherVelPerpendicular * Math.___(angle);

		//extrapolate start and end positions (need to know actual milliseconds for this)
		this._startPos = {
			x: collision.selfPos.x - this.vel.x * collision.time,
			y: collision.selfPos.y - this.vel.y * collision.time
		};
		this._endPos = {
			x: collision.selfPos.x + this.vel.x * collision.timeRemaining,
			y: collision.selfPos.y + this.vel.y * collision.timeRemaining
		};
		collision.other._startPos = {
			x: collision.otherPos.x - collision.other.vel.x * collision.time,
			y: collision.otherPos.y - collision.other.vel.y * collision.time
		};
		collision.other._endPos = {
			x: collision.otherPos.x + collision.other.vel.x * collision.timeRemaining,
			y: collision.otherPos.y + collision.other.vel.y * collision.timeRemaining
		};
	};
	FloatingMass.prototype.move = function() {
		this.pos.x = this._endPos.x;
		this.pos.y = this._endPos.y;
		this.facing = this._endPos.facing;
		this._endPos = null;
	};

	function processCollision() {
		//TODO with this being a collision object
	}

	return FloatingMass;
});