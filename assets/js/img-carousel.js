'use strict';
class imgCarousel extends EventTarget{
    constructor(container, options = {}){
        super();
        let self = this;
        this.carousel = document.getElementById(container);
        
        this.imgFilling = (  (options.imgFilling == 'fill') || (options.imgFilling == 'cover') || (options.imgFilling == 'contain') 
                                || (options.imgFilling == 'none') || (options.imgFilling == 'scale-down')  ) ?  options.imgFilling : 'fill';
        
        this.spaceBetweenSlides = ( (options.spaceBetweenSlides > 0) && ( typeof(options.spaceBetweenSlides) == 'number') ) ?  options.spaceBetweenSlides : 20;
                
        this.autoPlayInterval = ( (typeof(options.autoPlayInterval) == 'number' ) && ( options.autoPlayInterval > 0 ) ) ? options.autoPlayInterval: 5;
        this.autoPlay = ( typeof(options.autoPlay) == 'boolean' ) ? options.autoPlay: false;
        this.transition = ( typeof(options.transition) == 'number' ) ? options.transition: 1;
        this.paginationPosition = ( options.paginationPosition == 'inset' ) ? options.paginationPosition: 'outset';
        this.btnNavPosition = ( options.btnNavPosition == 'inset' ) ? options.btnNavPosition: 'outset';
        
        this.showPagination = ( options.showPagination === false ) ? options.showPagination: true;
        this.showBtnNav = ( options.showBtnNav === false ) ? options.showBtnNav: true;
                
        this.timeBank = this.autoPlayInterval;

        this.overlay = document.createElement('div');
        this.overlay.classList.add('overlay');
        this.carousel.prepend(this.overlay);

        //Получаем ширину и высоту
        let styles  = getComputedStyle(this.carousel);     
        this.width = styles.width;
        this.height = styles.height;
        
        this.transformLength = parseInt(this.width) + (2 * this.spaceBetweenSlides) + this.spaceBetweenSlides;
        this.startTransformation = this.transformLength *(-1);

        this.transformLengthAll = this.transformLength *(-1);
        
        this.animatedStarted = false;
        this.deltaWheel = 0;
        this.slideLine = document.createElement('div');
        this.slideLine.classList.add('slide-line');
        
        this.slideLineWrap = document.createElement('div');
        this.slideLineWrap.classList.add('slide-line-wrap');
        this.mouseMove = false;
        this.transition = this.transition + 's';
        this.imgsList = this.carousel.querySelectorAll('img');
        this.imgsList.forEach( (item, index) => {
            item.style.minWidth = this.width;
            item.style.maxWidth = this.width;
            item.style.height = this.height;
            item.style.objectFit = this.imgFilling;
            item.style.margin = '0 ' + this.spaceBetweenSlides + 'px';
           
        } );
        
        this.curPos = 0;
        this.prevPos = this.getPrevSlideIndex();

        for ( let i = 0; i < this.imgsList.length; i++){

            if ( i == this.imgsList.length - 1){
                this.slideLine.prepend(this.imgsList[i]);
            } else{
                this.slideLine.append(this.imgsList[i]);    
            }
            
        }
        this.slideLine.style.width = (this.imgsList.length * this.transformLength + this.imgsList.length * this.spaceBetweenSlides) + 'px';
        this.slideLine.style.transform = 'translateX('+ ( this.startTransformation  )+'px)';
        this.carousel.append(this.slideLineWrap);
        this.slideLineWrap.append(this.slideLine);

        this.createNavigationBtn();

        this.setOnTouchStart();
        this.setOnTouchEnd(); 

        this.pagination = document.createElement('div');
        this.pagination.classList.add('pagination');
        switch (this.paginationPosition){
            case 'inset': 
                this.pagination.classList.add('pagination_inset');
    
        }
        if ( this.showPagination === false ) this.pagination.style.display = 'none';
        
        this.carousel.append(this.pagination);
   
        this.createPaginationBtn() ;
        this.setWatchToWheel();


    }

    run(){
        let self = this;


        window.addEventListener('resize', ()=>{
            let styles  = getComputedStyle(this.carousel);     
            this.width = styles.width;
            this.height = styles.height;

            this.transformLength = parseInt(this.width) + (2 * this.spaceBetweenSlides) + this.spaceBetweenSlides;
            this.startTransformation = this.transformLength *(-1);
            this.transformLengthAll = this.transformLength *(-1);

            this.imgsList = this.carousel.querySelectorAll('img');
            this.imgsList.forEach( (item, index) => {
                item.style.minWidth = this.width;
                item.style.maxWidth = this.width;
                item.style.height = this.height;
            } );

            this.slideLine.style.transform = 'translateX('+ this.startTransformation + 'px)';
        })


        this.overlay.addEventListener('mousedown', (event)=>{
            if (this.animatedStarted === true ) {
               return false;
                
            }
            let self = this;
            let startX = event.layerX + self.startTransformation;
            
            let distance = 0;
            let percentMove = 0;
            let stopped = false;
            
            if ( this.animatedStarted == true) {
                stopped = true;                
                event.preventDefault();
                return false;
            } else {
                
            }

            this.slideLineWrap.ondrag = function(){
                return false;
            }

            this.overlay.onmousemove = function(event){
                
                event.preventDefault();
                
                let moveX = startX - (event.layerX + self.startTransformation);
                
                percentMove = (moveX / Math.abs( self.startTransformation ) )* 100;
                if (self.animatedStarted === false && self.mouseMove === false){
                if ( percentMove > 20 ){
                    self.prevPos = self.curPos;
                    self.curPos = self.getNextSlideIndex();
                                        
                    let move = new Event('nextslide');
                    self.dispatchEvent(move);
                    percentMove = 0;
                    distance = 0;
                    self.mouseMove = true;
                    self.slideLine.onmousemove = null;
                    return false;
                } else if ( percentMove < -20 ){
                    self.prevPos = self.curPos;
                    self.curPos = self.getPrevSlideIndex();
        
                        let move = new Event('prevslide');
                        self.dispatchEvent(move);
                        self.mouseMove = true;
                        
                        self.slideLine.onmousemove = null;
                        return false;
                                            
                }}              
                                
            }

            
            
            
            this.overlay.addEventListener('mouseup', ()=>{    
                
                this.overlay.onmousemove = null;
            });  

            this.overlay.onmouseout = function(){
                self.overlay.onmousemove = null;
            }
        
        });

        this.setAutoPlay( this.autoPlay );

        this.addEventListener('prevslide', ()=>{
                
            this.transformLengthAll += this.transformLength;                
                           
            this.imgsList = this.carousel.querySelectorAll('img');
            this.animatedStarted = true;
            this.slideLine.style.transition = this.transition;
            this.slideLine.style.transform = 'translateX('+( this.transformLengthAll -  this.spaceBetweenSlides)+'px)';
    
            this.setActivePaginationBtn(this.curPos);

            this.slideLine.ontransitionend = function(){
                
                self.slideLine.style.transition = '0s';
                self.transformLengthAll = self.startTransformation;
                self.slideLine.style.transform = 'translateX('+self.transformLengthAll+'px)';
                self.slideLine.prepend(self.imgsList[self.imgsList.length-1]);
                self.slideLine.ontransitionend = null;
                self.resetParametrs();
            }
        
        });

        this.addEventListener('nextslide', ()=>{    
            this.transformLengthAll -= this.transformLength;
                                
            this.imgsList = this.carousel.querySelectorAll('img');
            this.animatedStarted = true;
            
            this.slideLine.style.transition = this.transition;
            
            this.slideLine.style.transform = 'translateX('+( this.transformLengthAll + this.spaceBetweenSlides )+'px)';
           
            this.setActivePaginationBtn(this.curPos);

                this.slideLine.ontransitionend = function(){
                    
                    self.slideLine.style.transition = '0s';
                    self.transformLengthAll = self.startTransformation;
                    self.slideLine.style.transform = 'translateX('+self.transformLengthAll+'px)';
                    self.slideLine.append(self.imgsList[0]);
                    self.slideLine.ontransitionend = null;
                    self.resetParametrs();
                }     
            
        });

    }

    createNavigationBtn(){
        let self = this;

        let prevBtn = document.createElement('div');
        prevBtn.classList.add('prev-btn');

        switch ( this.btnNavPosition ){
            case 'inset': prevBtn.classList.add('prev-btn_inner');;
        }

        if ( this.showBtnNav === false) prevBtn.style.display = 'none';

        this.carousel.append(prevBtn);
        prevBtn.innerHTML = '&lsaquo;';
        prevBtn.onclick = function(){
            if ( self.animatedStarted === false ) {
                self.prevPos = self.curPos;
                self.curPos = self.getPrevSlideIndex();
                let move = new Event('prevslide');
                self.dispatchEvent(move);
            }
        }

        let nextBtn = document.createElement('div');
        nextBtn.classList.add('next-btn');

        if ( this.showBtnNav === false) nextBtn.style.display = 'none';

        this.carousel.append(nextBtn);
        switch ( this.btnNavPosition ){
            case 'inset': nextBtn.classList.add('next-btn_inner');;
        }
        nextBtn.innerHTML = '&rsaquo;';
        nextBtn.onclick = function(){
            if ( self.animatedStarted === false ) {
                self.prevPos = self.curPos;
                self.curPos = self.getNextSlideIndex();
                    
                let move = new Event('nextslide');
                self.dispatchEvent(move);
            }
            
        }

    }

    createPaginationBtn(){
        
        let self = this;
        
        this.imgsList.forEach( (item, index) => {
            let btn = document.createElement('div')
            btn.classList.add('pagination__button');
            let btnInner = document.createElement('div')
            btnInner.classList.add('pagination__button-inner');
            btn.setAttribute('data-index', index);
            btn.append(btnInner);

            btn.onclick = function(){                  
                
                let prevPos = self.curPos;
                let newPos = index;
                let slideOffset = newPos - prevPos;
                
                if ( (( slideOffset > 0 ) || ( slideOffset < 0 ) ) && ( self.animatedStarted == false ) ){
                    if ( slideOffset > 0 ) {
                        let imgsList = self.slideLine.querySelectorAll('img');
                        self.slideLine.style.transition = '0s';
                        self.slideLine.append( imgsList[0] );
                        self.slideLine.style.transform = 'translateX(' + ((-1)* self.spaceBetweenSlides)+'px)';                     
                                                
                        self.setActivePaginationBtn(newPos);

                        self.animatedStarted = true;

                        requestAnimationFrame(()=>{
                                
                            requestAnimationFrame(()=>{
                                self.slideLine.style.transition = self.transition;
                                
                                self.slideLine.style.transform = 'translateX(' + ( ( self.startTransformation  ) * (slideOffset) + ( (slideOffset - 1) * self.spaceBetweenSlides) ) + 'px)';
                                
                                
                            })
                        })
                            
                        self.curPos = index;    
                        self.slideLine.ontransitionend = function(){
                            self.slideLine.style.transition = '0s';
                            imgsList = self.slideLine.querySelectorAll('img');
                            
                            for (let i = 0; i < slideOffset - 1; i++){
                                
                                self.slideLine.append(imgsList[i]);
                                
                            }
                                                                                      
                            self.slideLine.style.transform = 'translateX(' + (self.startTransformation) + 'px)';
                            
                            self.slideLine.ontransitionend = null;
                            self.resetParametrs();
                            
                        }                         
                           
                    } else {
                        
                        let imgsList = self.slideLine.querySelectorAll('img');
                        self.slideLine.style.transition = '0s';  
                        
                        self.slideLine.append( imgsList[0] );  
                        self.slideLine.style.transform = 'translateX(' + ((-1)* self.spaceBetweenSlides)+'px)';         
                        
                        imgsList = self.slideLine.querySelectorAll('img');

                        for ( let  i = Math.abs( slideOffset), j = imgsList.length-1; i > 0; i--, j--){
                            self.slideLine.prepend(imgsList[j]);    
                        }

                        self.slideLine.style.transform = 'translateX(' + (self.startTransformation * (Math.abs( slideOffset) ) ) + 'px)';
                        
                        self.curPos = newPos;
                        self.setActivePaginationBtn(newPos);

                        self.animatedStarted = true;
                        requestAnimationFrame(()=>{
                                
                            requestAnimationFrame(()=>{
                                self.slideLine.style.transition = self.transition;
                                self.slideLine.style.transform = self.slideLine.style.transform = 'translateX(' + ((-1)* self.spaceBetweenSlides)+'px)';
                            })
                        })
                        self.slideLine.ontransitionend = function(){
                            self.slideLine.style.transition = '0s';
                            imgsList = self.slideLine.querySelectorAll('img');
                            self.slideLine.prepend(imgsList[imgsList.length - 1]);                           
                            self.slideLine.style.transform = 'translateX(' + (self.startTransformation) + 'px)';
                            self.slideLine.ontransitionend = null;
                            self.resetParametrs();
                        }

                    }
                }
                
            }

            this.pagination.append(btn);
        })
        
        this.paginationBtnList = this.pagination.querySelectorAll('.pagination__button');
            
        if ( this.paginationBtnList.length > 0 )  this.paginationBtnList[0].classList.add('pagination__button_active');


    }

    getNextSlideIndex(){
        if ( this.curPos == this.imgsList.length - 1 ) return 0;
            else return (this.curPos + 1);
    }

    getPrevSlideIndex(){
        if ( this.curPos == 0 ) return ( this.imgsList.length - 1 );
            else return (this.curPos - 1);
    }

    setActivePaginationBtn( index ){
        let btn_p = this.pagination.querySelector('.pagination__button_active');
        btn_p.classList.remove('pagination__button_active');
        let btn_a = this.pagination.querySelector('.pagination__button[data-index="'+index+'"]');
        btn_a.classList.add('pagination__button_active');
    }

    setWatchToWheel(){
        if (this.carousel.addEventListener) {
            if ('onwheel' in document) {
              
                this.carousel.addEventListener("wheel", (event)=>{
                this.onWheel(event)
              });
            } else if ('onmousewheel' in document) {
              
              this.carousel.addEventListener("mousewheel", (event)=>{
                this.onWheel(event)
              });
            } else {
              
              this.carousel.addEventListener("MozMousePixelScroll", (event)=>{
                this.onWheel(event)
              });
            }
          } else {
            this.carousel.attachEvent("onmousewheel", (event)=>{
                this.onWheel(event)
            });
          }
        
    }

    onWheel(event) {
        
        event = event || window.event;

        let delta = event.deltaY || event.detail || event.wheelDelta;

        if ( (delta > 0) && ( this.deltaWheel < 0 ) ) this.deltaWheel = 0;
        if ( (delta < 0) && ( this.deltaWheel > 0 ) ) this.deltaWheel = 0;

        if ( delta  > 0){
            this.deltaWheel++;  
            if ( this.deltaWheel > 2 ){ 
                if ( this.animatedStarted === false ) {
                    this.prevPos = this.curPos;
                    this.curPos = this.getNextSlideIndex();
                    let move = new Event('nextslide');
                    this.dispatchEvent(move);
                }
            }
        } else {
            this.deltaWheel--;
   
            if ( this.deltaWheel < -2 ){ 
                if ( this.animatedStarted === false ) {
                    this.prevPos = this.curPos;
                    this.curPos = this.getPrevSlideIndex();
                    let move = new Event('prevslide');
                    this.dispatchEvent(move);
                }
            }
        }
        
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    }

    setOnTouchStart(){
        this.carousel.addEventListener('touchstart', (event)=>{        
            this.mobile = true;
            this.startTouch = event.changedTouches[0].pageX;
        })
        
    }

    setOnTouchEnd(){
        this.carousel.addEventListener('touchend', (event)=>{
            if ( this.mobile ) {
                let delta = ( this.startTouch - event.changedTouches[0].pageX ); 
                
                if ( ( this.startTouch  > event.changedTouches[0].pageX ) &&  (this.startTouch - event.changedTouches[0].pageX > 100) ) {
                    if ( this.animatedStarted === false ) {
                        this.prevPos = this.curPos;
                        this.curPos = this.getNextSlideIndex();
                        
                        let move = new Event('nextslide');
                        this.dispatchEvent(move);
                    }
                }
 
                if ( ( this.startTouch  < event.changedTouches[0].pageX ) &&  ( event.changedTouches[0].pageX - this.startTouch > 100) ) {
                    if ( this.animatedStarted === false ) {
                        this.prevPos = this.curPos;
                        this.curPos = this.getPrevSlideIndex();
                        let move = new Event('prevslide');
                        this.dispatchEvent(move);
                    }     
                }
                this.mobile = false;
                this.startTouch = 0;
            }
        });
    }

    //Метод устанавливает режим прокрутки слайдов
    setAutoPlay( mode ){
        if ( mode ){
            setInterval( ()=>{                
                this.timeBank--;
                if ( this.timeBank <= 0 ){
                    this.prevPos = this.curPos;
                    this.curPos = this.getNextSlideIndex();                    
                    let move = new Event('nextslide');
                    this.dispatchEvent(move);
                    this.timeBank = this.autoPlayInterval;
                }
            }, 1000);
        }
    }

    resetParametrs(){
        this.deltaWheel = 0;
        this.timeBank = this.autoPlayInterval;
        this.animatedStarted = false;
        this.mouseMove = false;
    }

}

let options = {
    imgFilling: 'cover',
    spaceBetweenSlides: 10, 
    autoPlay: false,
    autoPlayInterval: 7,
    transition: .7,
    showPagination: true,
    showBtnNav: true,
    btnNavPosition: 'outset',
    paginationPosition: 'outset'
}
let c = new imgCarousel('c', options).run();