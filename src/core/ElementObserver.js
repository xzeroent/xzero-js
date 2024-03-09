class ElementObserver {

	constructor( element ) {

		this.element = element;
		this.width = 0;
		this.height = 0;
		this.visible = false;
		this.withinView = false;
		
		this.observe();

	}


	observe() {
		
		this.observeResize();
		this.observeIntersection();
		
	}
	
	
	unobserve() {
		
		this.unobserveResize();
		this.unobserveIntersection();		
		
	}
	
	
	reset() {
		
		this.unobserve();
		this.observe();	
		
	}
	
	
	
	observeIntersection() {
		
		this.intersectionObserver = new IntersectionObserver(
			entries => {
				entries.forEach( entry => this.checkIntersection(entry.isIntersecting) );
			},
			{
				root: this.ownerDocument
			}
		);

		this.intersectionObserver.observe( this.element );

	}
	
		
	unobserveIntersection() {
		
		this.intersectionObserver.unobserve( this.element );
		this.intersectionObserver.disconnect();
		delete this.intersectionObserver;	
		
	}
	
	
	checkIntersection( intersecting = false ) {
				
		if ( this.withinView !== intersecting ) {
			this.withinView = intersecting;
			
			if ( this.withinView ) {
				this.element.enterViewCallback();
			} else {
				this.element.leaveViewCallback();
			}
			
		}
		
	}
	
	
	
	observeResize() {
		
		if ( typeof ResizeObserver === 'function' ) {
		
			this.resizeObserver = new ResizeObserver(
				entries => {
					entries.forEach( entry => this.checkSize() );
				}
			);

			this.resizeObserver.observe( this.element );

		} else {
			
			this.requestId = requestAnimationFrame( ()=>this.checkSize() );
			
		}

	}
	
		
	unobserveResize() {
		
		if ( typeof ResizeObserver === 'function' ) {
			
			this.resizeObserver.unobserve( this.element );
			this.resizeObserver.disconnect();
			delete this.resizeObserver;	

		} else {
			
			cancelAnimationFrame( this.requestId );
			
		}
		
	}
	
	
	checkSize() {
		
		if ( typeof ResizeObserver !== 'function' ) {			
			this.requestId = requestAnimationFrame( ()=>this.checkSize() );
		}
		
		let width = this.element.offsetWidth, height = this.element.offsetHeight;
		let visible = width > 0 && height > 0;
		
		if ( this.visible !== visible ) {
			this.visible = visible;
			if ( this.visible ) {
				this.element.showCallback();
			} else {
				this.element.hideCallback();
			}
		}
		
		if ( ! this.visible ) {
			this.width = 0;
			this.height = 0;
			return;			
		}
		
		if ( this.width !== width || this.height !== height ) {
			this.width = width;
			this.height = height;
			this.element.resizeCallback();			
		}
		
	}	

};


export { ElementObserver };