function pyth(xA,yA,xB,yB) {
    var a = Math.abs(xB - xA);
    var b = Math.abs(yB - yA);
    var c = Math.sqrt(a**2 + b**2);
    return c;
};

elements.creeper = {
	color: ["#D2D2D2", "#BFDFB9", "#94CE89", "#78D965", "#5ED54C", "#58C546", "#50B143", "#479143", "#559552", "#3F8738", "#5B8B59"],
	category: "life",
	properties: {
		dead: false,
		dir: 1,
		panic: 0,
		following: false,
	},
	tick: function(pixel) {
		if (isEmpty(pixel.x, pixel.y+1)) {
			createPixel("creeper_body", pixel.x, pixel.y+1);
			pixel.element = "creeper_head";
		}
		else if (isEmpty(pixel.x, pixel.y-1)) {
			createPixel("creeper_head", pixel.x, pixel.y-1);
			pixelMap[pixel.x][pixel.y-1].color = pixel.color;
			pixel.element = "creeper_body";
			pixel.color = pixelColorPick(pixel)
		}
		else {
			deletePixel(pixel.x, pixel.y);
		}
	},
	related: ["creeper_body","creeper_head"],
};

elements.creeper_body = {
	color: ["#D2D2D2", "#BFDFB9", "#94CE89", "#78D965", "#5ED54C", "#58C546", "#50B143", "#479143", "#559552", "#3F8738", "#5B8B59"],
	category: "life",
	hidden: true,
	density: 1500,
	state: "solid",
	conduct: 25,
	tempHigh: 250,
	stateHigh: "cooked_meat",
	tempLow: -30,
	stateLow: "frozen_meat",
	burn: 10,
	burnTime: 250,
	burnInto: "cooked_meat",
	breakInto: ["blood","gunpowder"],
	reactions: {
		"cancer": { "elem1":"cancer", "chance":0.005 },
		"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
		"plague": { "elem1":"plague", "chance":0.05 },
	},
	properties: {
		dead: false,
		dir: 1,
		panic: 0,
		charged: false,
	},
	tick: function(pixel) {
		if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
			if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
				var headpixel = pixelMap[pixel.x][pixel.y-2];
				if (headpixel.element == "creeper_head") {
					if (isEmpty(pixel.x, pixel.y-1)) {
						movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
					}
					else {
						swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
					}
				}
			}
		}
		doHeat(pixel);
		doBurning(pixel);
		doElectricity(pixel);
		if (pixel.dead) {
			// Turn into rotten_meat if pixelTicks-dead > 500
			if (pixelTicks-pixel.dead > 200) {
				Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
			}
			return
		}

		// Find the head
		if (!isEmpty(pixel.x, pixel.y-1, true) && pixelMap[pixel.x][pixel.y-1].element == "creeper_head") {
			var head = pixelMap[pixel.x][pixel.y-1];
			if (head.dead) { // If head is dead, kill body
				pixel.dead = head.dead;
			}
		}
		else { var head = null }

		if (isEmpty(pixel.x, pixel.y-1)) {
			// create blood if decapitated 10% chance
			if (Math.random() < 0.1) {
				createPixel("blood", pixel.x, pixel.y-1);
				// set dead to true 15% chance
				if (Math.random() < 0.15) {
					pixel.dead = pixelTicks;
				}
			}
		}
		else if (head == null) { return }
		else if (Math.random() < 0.1) { // Move 10% chance
			var movesToTry = [
				[1*pixel.dir,0],
				[1*pixel.dir,-1],
			];
			// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
			while (movesToTry.length > 0) {
				var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
				if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
					if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
						movePixel(head, head.x+move[0], head.y+move[1]);
						break;
					};
				};
			};
			// 15% chance to change direction while not chasing a human
			if(!head.following) {
				if (Math.random() < 0.15) {
					pixel.dir *= -1;
					//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
				};
			} else {
				//console.log("*chases cutely*");
			};
		};

		if(pixel.charge) {
			pixel.charged = true;
		};
		
		if(head) {
			if(typeof(head.charge) !== "undefined") {
				if(head.charge) {
					pixel.charged = true;
				};
			};
			if(typeof(head.charged) !== "undefined") {
				if(head.charged) {
					pixel.charged = true;
				};
			};
		};

		if(typeof(pixel.charged) === "undefined") {
			pixel.charged = false;
		};

		if(pixel.charged) {
			var explosionRadius = 10;
		} else {
			var explosionRadius = 7;
		};
		
		if(pixel.burning) {
			if(!pixel.burnStart) { //I don't like errors.
				pixel.burnStart = pixel.ticks;
			};
			if(pixelTicks - pixel.burnStart > explosionRadius) {
				//console.log("Kaboom?");
				explodeAt(pixel.x,pixel.y,7);
				//console.log("Yes, Rico, kaboom.");
			};
		};
	},
},
elements.creeper_head = {
	color: ["#5B8B59", "#3F8738", "#559552", "#479143", "#50B143", "#58C546"],
	category: "life",
	hidden: true,
	density: 1080,
	state: "solid",
	conduct: 25,
	tempHigh: 250,
	stateHigh: "cooked_meat",
	tempLow: -30,
	stateLow: "frozen_meat",
	burn: 10,
	burnTime: 250,
	burnInto: "cooked_meat",
	breakInto: "blood",
	reactions: {
		"cancer": { "elem1":"cancer", "chance":0.005 },
		"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
		"plague": { "elem1":"plague", "chance":0.05 },
		"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
	},
	properties: {
		dead: false,
		following: false,
		hissing: false,
		charged: false,
	},
	tick: function(pixel) {
		doHeat(pixel);
		doBurning(pixel);
		doElectricity(pixel);
		if (pixel.dead) {
			// Turn into rotten_meat if pixelTicks-dead > 500
			if (pixelTicks-pixel.dead > 200) {
				Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				return
			}
		}

		// Find the body
		if (!isEmpty(pixel.x, pixel.y+1, true) && pixelMap[pixel.x][pixel.y+1].element == "creeper_body") {
			var body = pixelMap[pixel.x][pixel.y+1];
			if (body.dead) { // If body is dead, kill head
				pixel.dead = body.dead;
			}
		}
		else { var body = null }

		if(body) {
			if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
				pixel.dir = body.dir;
			};
		};

		if (isEmpty(pixel.x, pixel.y+1)) {
			tryMove(pixel, pixel.x, pixel.y+1);
			// create blood if severed 10% chance
			if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
				createPixel("blood", pixel.x, pixel.y+1);
				// set dead to true 15% chance
				if (Math.random() < 0.15) {
					pixel.dead = pixelTicks;
				}
			}
		}
		
		//start of most new code
		var pX = pixel.x;
		var pY = pixel.y;
		
		if(pixel.charge) {
			pixel.charged = true;
		};
		
		if(body) {
			if(typeof(body.charge) !== "undefined") {
				if(body.charge) {
					pixel.charged = true;
				};
			};
			if(typeof(body.charged) !== "undefined") {
				if(body.charged) {
					pixel.charged = true;
				};
			};
		};
		
		if(typeof(pixel.charged) === "undefined") {
			pixel.charged = false;
		};

		if(pixel.charged) {
			var explosionRadius = 10;
		} else {
			var explosionRadius = 7;
		};
		
		//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
		var directionAdverb = "left";
		if(pixel.dir > 0) {
			directionAdverb = "right";
		};
		//console.log(`Looking ${directionAdverb}`)
		if(pixel.dir === -1) {
			for(i = -4; i < 4+1; i++) {
				var oY = i;
				//console.log(`Starting row look at row ${pY+oY}`)
				for(j = (-1); j > (-16 - 1); j--) {
					var oX = j;
					var nX = pX+oX;
					var nY = pY+oY;
					if(outOfBounds(nX,nY)) {
						//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
						break;
					};
					if(isEmpty(nX,nY)) {
						////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
						continue;
					};
					if(!isEmpty(nX,nY,true)) {
						var newPixel = pixelMap[nX][nY];
						var newElement = newPixel.element;
						if(["head","body"].includes(newElement)) {
							//console.log(`Human part found at (${nX},${nY})`)
							if(!newPixel.dead) {
								pixel.following = true;
								//console.log(`Human detected at (${nX},${nY})`)
								//Start "hissing" if a human is close enough
								if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
									pixel.hissing = true;
									if(!pixel.hissStart) {
										pixel.hissStart = pixelTicks;
									};
								};
							};
						} else {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
							break;
						};
					};
				};
			};
		} else if(pixel.dir === 1) {
			for(i = -4; i < 4+1; i++) {
				var oY = i;
				//console.log(`Starting row look at row ${pY+oY}`)
				for(j = 1; j < 16 + 1; j++) {
					var oX = j;
					var nX = pX+oX;
					var nY = pY+oY;
					if(outOfBounds(nX,nY)) {
						//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
						break;
					};
					if(isEmpty(nX,nY)) {
						////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
						continue;
					};
					if(!isEmpty(nX,nY,true)) {
						var newPixel = pixelMap[nX][nY];
						var newElement = newPixel.element;
						if(["head","body"].includes(newElement)) {
							//console.log(`Human part found at (${nX},${nY})`)
							if(!newPixel.dead) {
								pixel.following = true;
								//console.log(`Human detected at (${nX},${nY})`)
								//Start "hissing" if a human is close enough
								if(pyth(pX,pY,nX,nY) <= 3.15) {
									pixel.hissing = true;
									if(!pixel.hissStart) {
										pixel.hissStart = pixelTicks;
									};
								};
							};
						} else {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
							break;
						};
					};
				};
			};
		};
		
		//Pre-explosion handler: keeps track of time before the kaboom
		for(i = 0; i < 1; i++) { //dummy for loop
			if(pixel.hissing) {
				//console.log("Ssssssss");
				if(pixel.dead || !body || body.dead) { //can't explode without a body according to the classic creeper anatomy
					//console.log("ss-- oof");
					pixel.hissing = false;
					break;
				};
				if(!pixel.hissStart) {
					//console.log("t-30 ticks or whatever it was");
					pixel.hissStart = pixelTicks;
				};
				if(pixelTicks - pixel.hissStart > 30) {
					//console.log("Kaboom?");
					//console.log(`Exploding with radius ${explosionRadius} (charged: ${pixel.charged})`);
					explodeAt(body.x,body.y,explosionRadius);
					//console.log("Yes, Rico, kaboom.");
				};
			};
		};
		
		if(Math.random() < 0.01) { //1% chance each tick to lose interest
			pixel.following = false;
			//console.log("Meh.");
		};
	},
};