/**
 * Created by zhuang on 2017/7/26.
 */
// var app = new Vue({
//     el:'#app',
//     data:{
//         count:0
//     },
//     methods:{
//         increment:function(){
//             this.count++;
//         }
//     }
// });
function Zue(options) {
    this._init(options);
}
Zue.prototype._init = function (options) {
    this.$options = options;
    this.$el = document.querySelector(options.el);
    this.$methods = options.methods;
    this.$data = options.data;
    this._binding = {};
    this._parseData(this.$data);
    this._parseFunc(this.$methods);
    this._compile(this.$el);
};
/**
 * 用Object.defineProperty对data中的数据对象进行改造，添加getter/setter
 */
Zue.prototype.convert = function (key,value) {
    var _this = this;
    Object.defineProperty(this.$data,key,{
        enumerable:true,
        configurable:true,
        get:function () {
            console.log(`获取${value}`);
            return value;
        },
        set:function (newValue) {
            console.log(`更新${newValue}`);
            if(value!=newValue){
                value = newValue;
                _this._binding[key]._directives.forEach(function (item) {
                    item.update();
                })
            }
        }
    })
};
/**
 * 让每个obj带有getter和setter属性
 * @param obj
 * @private
 */
Zue.prototype._parseData = function(obj){
    var value ;
    for(var key in obj){
        if(obj.hasOwnProperty(key)){
            /**
             * 初始化与DOM绑定的数据对象
             * @type {{_directives: Array}}
             */
            this._binding[key] = {
                _directives:[]
            };
            value = obj[key];
            if(typeof value === 'object'){
                this._parseData(value);
            }
            this.convert(key,value);
        }
    }
};
/**
 * 改变methods里的函数作用域，要求和zue.$data一致
 * @param funcList
 * @private
 */
Zue.prototype._parseFunc = function (funcList) {
    var _this = this;
    for(var key in funcList){
        if(funcList.hasOwnProperty(key)){
            funcList[key] = (function () {
                var func = funcList[key];
                return function(){
                    func.apply(_this.$data,arguments);
                }
            })();
        }
    }
};
/**
 * 编译DOM节点
 * @private
 */
Zue.prototype._compile = function (root) {
    var _this = this;
    var nodes = root.children;
    for(var i = 0;i<nodes.length;i++){
        var node = nodes[i];
        if(node.children.length){
            this._compile(node);
        }
        if(node.hasAttribute('z-click')){
            node.onclick = (function () {
                var attrVal = node.getAttribute('z-click');
                var args = /\(.*\)/.exec(attrVal);
                if(args){
                    args = args[0];
                    attrVal = attrVal.replace(args,'');
                    args = args.replace(/[\(|\)|\'|\"]/g,'').split(',');
                }else args = [];
                return function () {
                    _this.$methods[attrVal].apply(_this.$data,args);
                }
            })();
        }
        if(node.hasAttribute('z-model')&&(node.tagName==='INPUT'||node.targetName==='TEXTAREA')){
            node.addEventListener('input',(function (key) {
                var attrVal = node.getAttribute('z-model');
                _this._binding[attrVal]._directives.push(new Directive(
                    'input',
                    node,
                    _this,
                    attrVal,
                    'value'
                ));
                return function () {
                    _this.$data[attrVal] = nodes[key].value;
                    // _this.$data[attrVal] = nodes.value;
                }
            })(i));
        }
        if(node.hasAttribute('z-bind')){
            var attrVal = node.getAttribute('z-bind');
            _this._binding[attrVal]._directives.push(new Directive(
               'text',
                node,
                _this,
                attrVal,
                'innerHTML'
            ));
        }
    }
};
function Directive(name,el,zm,exp,attr) {
    this.name = name;//指令名称，例如文本节点，该值设为text
    this.el = el;   //指令对应的DOM元素
    this.zm = zm;   //Zue的实例
    this.exp = exp; //指令对应的值
    this.attr = attr;//绑定的属性值
    this.update();//首次绑定时更新
}
Directive.prototype.update = function () {
    this.el[this.attr] = this.zm.$data[this.exp];
};