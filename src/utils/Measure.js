
Potree.Measure = class Measure extends THREE.Object3D{
	constructor(){
		super();
		
		this.points = [];
		this._showDistances = true;
		this._showCoordinates = false;
		this._showArea = false;
		this._closed = true;
		this._showAngles = false;
		this._showHeight = false;
		this.maxMarkers = Number.MAX_SAFE_INTEGER;
		
		this.sphereGeometry = new THREE.SphereGeometry(0.4, 10, 10);
		this.color = new THREE.Color( 0xff0000 );
		
		this.spheres = [];
		this.edges = [];
		this.sphereLabels = [];
		this.edgeLabels = [];
		this.angleLabels = [];
		this.coordinateLabels = [];
		
		this.heightEdge;
		this.heightLabel;
		{ // height stuff
			
			{ // height line
				let lineGeometry = new THREE.Geometry();
				lineGeometry.vertices.push(
					new THREE.Vector3(), 
					new THREE.Vector3(), 
					new THREE.Vector3(), 
					new THREE.Vector3());
				lineGeometry.colors.push(this.color, this.color, this.color);
				let lineMaterial = new THREE.LineDashedMaterial( 
					{ color: 0xff0000, dashSize: 5, gapSize: 2 } );
				
				lineMaterial.depthTest = false;
				this.heightEdge = new THREE.Line(lineGeometry, lineMaterial);
				this.heightEdge.visible = false;
				
				this.add(this.heightEdge);
			}
			
			{ // height label
				this.heightLabel = new Potree.TextSprite("");
				this.heightLabel.setBorderColor({r:0, g:0, b:0, a:0.8});
				this.heightLabel.setBackgroundColor({r:0, g:0, b:0, a:0.3});
				this.heightLabel.setTextColor({r:180, g:220, b:180, a:1.0});
				this.heightLabel.material.depthTest = false;
				this.heightLabel.material.opacity = 1;
				this.heightLabel.visible = false;;
				this.add(this.heightLabel);
			}
		}
		
		this.areaLabel = new Potree.TextSprite("");
		this.areaLabel.setBorderColor({r:0, g:0, b:0, a:0.8});
		this.areaLabel.setBackgroundColor({r:0, g:0, b:0, a:0.3});
		this.areaLabel.setTextColor({r:180, g:220, b:180, a:1.0});
		this.areaLabel.material.depthTest = false;
		this.areaLabel.material.opacity = 1;
		this.areaLabel.visible = false;;
		this.add(this.areaLabel);
		
		
	}
	
	createSphereMaterial(){
		let sphereMaterial = new THREE.MeshLambertMaterial({
			shading: THREE.SmoothShading, 
			color: this.color, 
			depthTest: false, 
			depthWrite: false}
		);
		
		return sphereMaterial;
	};
	
	addMarker(point){
		if(point instanceof THREE.Vector3){
			point = {position: point};
		}
		this.points.push(point);
		
		// sphere
		let sphere = new THREE.Mesh(this.sphereGeometry, this.createSphereMaterial());
		
		this.add(sphere);
		this.spheres.push(sphere);
		
		{ // edges
			let lineGeometry = new THREE.Geometry();
			lineGeometry.vertices.push(new THREE.Vector3(), new THREE.Vector3());
			lineGeometry.colors.push(this.color, this.color, this.color);
			let lineMaterial = new THREE.LineBasicMaterial( { 
				linewidth: 1
			});
			lineMaterial.depthTest = false;
			let edge = new THREE.Line(lineGeometry, lineMaterial);
			edge.visible = true;
			
			this.add(edge);
			this.edges.push(edge);
		}
		
		
		{ // edge labels
			let edgeLabel = new Potree.TextSprite();
			edgeLabel.setBorderColor({r:0, g:0, b:0, a:0.8});
			edgeLabel.setBackgroundColor({r:0, g:0, b:0, a:0.3});
			edgeLabel.material.depthTest = false;
			edgeLabel.visible = false;
			this.edgeLabels.push(edgeLabel);
			this.add(edgeLabel);
		}
		
		{ // angle labels
			let angleLabel = new Potree.TextSprite();
            angleLabel.setBorderColor({r:0, g:0, b:0, a:0.8});
			angleLabel.setBackgroundColor({r:0, g:0, b:0, a:0.3});
            angleLabel.material.depthTest = false;
            angleLabel.material.opacity = 1;
			angleLabel.visible = false;
			this.angleLabels.push(angleLabel);
			this.add(angleLabel);
		}
		
		{ // coordinate labels
			let coordinateLabel = new Potree.TextSprite();
			coordinateLabel.setBorderColor({r:0, g:0, b:0, a:0.8});
			coordinateLabel.setBackgroundColor({r:0, g:0, b:0, a:0.3});
			coordinateLabel.material.depthTest = false;
			coordinateLabel.material.opacity = 1;
			coordinateLabel.visible = false;
			this.coordinateLabels.push(coordinateLabel);
			this.add(coordinateLabel);
		}
		
		{ // Event Listeners
			let drag = (e) => {
				let I = Potree.utils.getMousePointCloudIntersection(
					e.drag.end, 
					e.viewer.scene.camera, 
					e.viewer.renderer, 
					e.viewer.scene.pointclouds);
				
				if(I){
					let i = this.spheres.indexOf(e.drag.object);
					if(i !== -1){
						this.setPosition(i, I.location);
						this.dispatchEvent({
							"type": "marker_moved",
							"measurement": this,
							"index": i
						});
					}
				}
			};
			
			let drop = e => {
				let i = this.spheres.indexOf(e.drag.object);
				if(i !== -1){
					this.dispatchEvent({
						"type": "marker_dropped",
						"measurement": this,
						"index": i
					});
				}
			};
			
			let mouseover = (e) => e.object.material.emissive.setHex(0x888888);
			let mouseleave = (e) => e.object.material.emissive.setHex(0x000000);
			
			sphere.addEventListener("drag", drag);
			sphere.addEventListener("drop", drop);
			sphere.addEventListener("mouseover", mouseover);
			sphere.addEventListener("mouseleave", mouseleave);
		}

		let event = {
			type: "marker_added",
			measurement: this,
			sphere: sphere
		};
		this.dispatchEvent(event);
		
		this.setMarker(this.points.length-1, point);
	};
	
	removeMarker(index){
		this.points.splice(index, 1);
		
		this.remove(this.spheres[index]);
		
		let edgeIndex = (index === 0) ? 0 : (index - 1);
		this.remove(this.edges[edgeIndex]);
		this.edges.splice(edgeIndex, 1);
		
		this.remove(this.edgeLabels[edgeIndex]);
		this.edgeLabels.splice(edgeIndex, 1);
		this.coordinateLabels.splice(index, 1);
		
		this.spheres.splice(index, 1);
		
		this.update();
		
		this.dispatchEvent({type: "marker_removed", measurement: this});
	};
	
	setMarker(index, point){
		this.points[index] = point;
		
		let event = {
			type: 		'marker_moved',
			measure:	this,
			index:		index,
			position: 	point.position.clone()
		};
		this.dispatchEvent(event);
		
		this.update();
	}
	
	setPosition(index, position){
		let point = this.points[index];			
		point.position.copy(position);
		
		let event = {
			type: 		'marker_moved',
			measure:	this,
			index:		index,
			position: 	position.clone()
		};
		this.dispatchEvent(event);
		
		this.update();
	};
	
	getArea(){
		let area = 0;
		let j = this.points.length - 1;
		
		for(let i = 0; i < this.points.length; i++){
			let p1 = this.points[i].position;
			let p2 = this.points[j].position;
			area += (p2.x + p1.x) * (p1.z - p2.z);
			j = i;
		}
		
		return Math.abs(area / 2);
	};
	
	getTotalDistance(){
		
		if(this.points.length === 0){
			return 0;
		}
		
		let distance = 0;
		
		for(let i = 1; i < this.points.length; i++){
			let prev = this.points[i-1].position;
			let curr = this.points[i].position;
			let d = prev.distanceTo(curr);
			
			distance += d;
		}
		
		if(this.closed && this.points.length > 1){
			let first = this.points[0].position;
			let last = this.points[this.points.length - 1].position;
			let d = last.distanceTo(first);
			
			distance += d;
		}
		
		return distance;
	}
	
	getAngleBetweenLines(cornerPoint, point1, point2) {
        let v1 = new THREE.Vector3().subVectors(point1.position, cornerPoint.position);
        let v2 = new THREE.Vector3().subVectors(point2.position, cornerPoint.position);
        return v1.angleTo(v2);
    };
	
	getAngle(index){
	
		if(this.points.length < 3 || index >= this.points.length){
			return 0;
		}
		
		let previous = (index === 0) ? this.points[this.points.length-1] : this.points[index-1];
		let point = this.points[index];
		let next = this.points[(index + 1) % (this.points.length)];
		
		return this.getAngleBetweenLines(point, previous, next);
	};
	
	update(){
	
		if(this.points.length === 0){
			return;
		}else if(this.points.length === 1){
			let point = this.points[0];
			let position = point.position;
			this.spheres[0].position.copy(position);
			
			{// coordinate labels
				let coordinateLabel = this.coordinateLabels[0];
				
				let labelPos = position.clone().add(new THREE.Vector3(0,1,0));
				coordinateLabel.position.copy(labelPos);
				
				let msg = Potree.utils.addCommas(position.x.toFixed(2)) 
					+ " / " + Potree.utils.addCommas(position.y.toFixed(2)) 
					+ " / " + Potree.utils.addCommas(position.z.toFixed(2));
				coordinateLabel.setText(msg);
				
				coordinateLabel.visible = this.showCoordinates;
			}
			
			return;
		}
		
		let lastIndex = this.points.length - 1;
		
		let centroid = new THREE.Vector3();
		for(let i = 0; i <= lastIndex; i++){
			let point = this.points[i];
			centroid.add(point.position);
		}
		centroid.divideScalar(this.points.length);
		
		for(let i = 0; i <= lastIndex; i++){
			let index = i;
			let nextIndex = ( i + 1 > lastIndex ) ? 0 : i + 1;
			let previousIndex = (i === 0) ? lastIndex : i - 1;
		
			let point = this.points[index];
			let nextPoint = this.points[nextIndex];
			let previousPoint = this.points[previousIndex];
			
			let sphere = this.spheres[index];
			
			// spheres
			sphere.position.copy(point.position);
			sphere.material.color = this.color;

			{// edges
				let edge = this.edges[index];
				
				edge.material.color = this.color;
				
				edge.position.copy(point.position);
				
				edge.geometry.vertices[0].set(0, 0, 0);
				edge.geometry.vertices[1].copy(nextPoint.position).sub(point.position);
				
				edge.geometry.verticesNeedUpdate = true;
				edge.geometry.computeBoundingSphere();
				edge.visible = index < lastIndex || this.closed;
			}
			
			{// edge labels
				let edgeLabel = this.edgeLabels[i];
			
				let center = new THREE.Vector3().add(point.position);
				center.add(nextPoint.position);
				center = center.multiplyScalar(0.5);
				let distance = point.position.distanceTo(nextPoint.position);
				
				edgeLabel.position.copy(center);
				edgeLabel.setText(Potree.utils.addCommas(distance.toFixed(2)));
				edgeLabel.visible = this.showDistances && (index < lastIndex || this.closed) && this.points.length >= 2 && distance > 0;
			}
			
			{// angle labels
				let angleLabel = this.angleLabels[i];
				let angle = this.getAngleBetweenLines(point, previousPoint, nextPoint);
				
				let dir = nextPoint.position.clone().sub(previousPoint.position);
				dir.multiplyScalar(0.5);
				dir = previousPoint.position.clone().add(dir).sub(point.position).normalize();
				
				let dist = Math.min(point.position.distanceTo(previousPoint.position), point.position.distanceTo(nextPoint.position));
				dist = dist / 9;
				
				let labelPos = point.position.clone().add(dir.multiplyScalar(dist));
				angleLabel.position.copy(labelPos);
				
				let msg = Potree.utils.addCommas((angle*(180.0/Math.PI)).toFixed(1)) + '\u00B0';
				angleLabel.setText(msg);
				
				angleLabel.visible = this.showAngles && (index < lastIndex || this.closed) && this.points.length >= 3 && angle > 0;
			}
			
			{// coordinate labels
				let coordinateLabel = this.coordinateLabels[0];
				
				let labelPos = point.position.clone().add(new THREE.Vector3(0,1,0));
				coordinateLabel.position.copy(labelPos);
				
				let msg = Potree.utils.addCommas(point.position.x.toFixed(2)) 
					+ " / " + Potree.utils.addCommas(point.position.y.toFixed(2)) 
					+ " / " + Potree.utils.addCommas(point.position.z.toFixed(2));
				coordinateLabel.setText(msg);
				
				//coordinateLabel.visible = this.showCoordinates && (index < lastIndex || this.closed);
				coordinateLabel.visible = this.showCoordinates;
			}
		}

		{ // update height stuff
			let heightEdge = this.heightEdge;
			heightEdge.visible = this.showHeight;
			this.heightLabel.visible = this.showHeight;
			
			if(this.showHeight){
				let sorted = this.points.slice().sort( (a, b) => a.position.z - b.position.z );
				let lowPoint = sorted[0].position.clone();
				let highPoint = sorted[sorted.length - 1].position.clone();
				let min = lowPoint.z;
				let max = highPoint.z;
				let height = max - min;
				
				let start = new THREE.Vector3(highPoint.x, highPoint.y, min);
				let end = new THREE.Vector3(highPoint.x, highPoint.y, max);
				
				heightEdge.position.copy(lowPoint);
				
				heightEdge.geometry.vertices[0].set(0, 0, 0);
				heightEdge.geometry.vertices[1].copy(start).sub(lowPoint);
				heightEdge.geometry.vertices[2].copy(start).sub(lowPoint);
				heightEdge.geometry.vertices[3].copy(end).sub(lowPoint);
				
				heightEdge.geometry.verticesNeedUpdate = true;
				//heightEdge.geometry.computeLineDistances();
				//heightEdge.geometry.lineDistancesNeedUpdate = true;
				heightEdge.geometry.computeBoundingSphere();
				
				//heightEdge.material.dashSize = height / 40;
				//heightEdge.material.gapSize = height / 40;
				
				
				let heightLabelPosition = start.clone().add(end).multiplyScalar(0.5);
				this.heightLabel.position.copy(heightLabelPosition);
				let msg = Potree.utils.addCommas(height.toFixed(2));
				this.heightLabel.setText(msg);
			}
			
		}
		
		{ // update area label
			this.areaLabel.position.copy(centroid);
			this.areaLabel.visible = this.showArea && this.points.length >= 3;
			let msg = Potree.utils.addCommas(this.getArea().toFixed(1)) + "\u00B2";
			this.areaLabel.setText(msg);
		}
	};
	
	raycast(raycaster, intersects){
		
		for(let i = 0; i < this.points.length; i++){
			let sphere = this.spheres[i];
			
			sphere.raycast(raycaster, intersects);
		}
		
		// recalculate distances because they are not necessarely correct
		// for scaled objects.
		// see https://github.com/mrdoob/three.js/issues/5827
		// TODO: remove this once the bug has been fixed
		for(let i = 0; i < intersects.length; i++){
			let I = intersects[i];
			I.distance = raycaster.ray.origin.distanceTo(I.point);
		}
		intersects.sort( function ( a, b ) { return a.distance - b.distance;} );
	};
	
	get showCoordinates(){
		return this._showCoordinates;
	}
	
	set showCoordinates(value){
		this._showCoordinates = value;
		this.update();
	}
	
	get showAngles(){
		return this._showAngles;
	}
	
	set showAngles(value){
		this._showAngles = value;
		this.update();
	}
	
	get showHeight(){
		return this._showHeight;
	}
	
	set showHeight(value){
		this._showHeight = value;
		this.update();
	}
	
	get showArea(){
		return this._showArea;
	}
	
	set showArea(value){
		this._showArea = value;
		this.update();
	}
	
	get closed(){
		return this._closed;
	}
	
	set closed(value){
		this._closed = value;
		this.update();
	}
	
	get showDistances(){
		return this._showDistances;
	}
	
	set showDistances(value){
		this._showDistances = value;
		this.update();
	}
};