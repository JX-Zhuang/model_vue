/**
 * Created by zhuang on 2017/7/26.
 */
var app = new Zue({
    el:'#app',
    data:{
        count:0
    },
    methods:{
        increment:function(){
            this.count++;
            console.log(this);
        },
        alert:function(msg){
            alert(msg)
        }
    }
})