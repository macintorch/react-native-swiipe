import React, { Component } from 'react';
import { View, Animated, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {

	static defaultProps = {
		onSwipeRight: () => {},
		onSwipeLeft: () => {}

	}

	constructor(props) {
		super(props);

		const position = new Animated.ValueXY();
		
		//gesture setup
		const panResponder = PanResponder.create({

			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (event, gesture) => {
				//console.log(gesture);
				position.setValue({ x: gesture.dx, y: gesture.dy });
			},

			onPanResponderRelease: (event, gesture) => {

				if (gesture.dx > SWIPE_THRESHOLD) {
					console.log('swipe right!');
					this.forceSwipe('right');
				} else if (gesture.dx < -SWIPE_THRESHOLD) {
					console.log('swipe left!');
					this.forceSwipe('left');
				} else {
					this.resetPosition();
				}
			}		

		});

		this.state = { panResponder, position, index: 0 };
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.data !== this.props.data) {
			this.setState({ index: 0 });
		}
	}

	componentWillUpdate() {
		UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
		LayoutAnimation.spring();
	}

	forceSwipe(direction) {
		const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;

		Animated.timing(this.state.position, {
			toValue: { x, y: 0 },
			duration: SWIPE_OUT_DURATION
		}).start(() => this.onSwipeComplete(direction));
	}

	onSwipeComplete(direction) {
		const { onSwipeLeft, onSwipeRight, data } = this.props;
		const item = data[this.state.index];

		direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

		// reset card position to (0,0)
		this.state.position.setValue({ x: 0, y:0 });

		//reset the index
		this.setState({ index: this.state.index + 1 });
	}

	resetPosition() {
		Animated.spring(this.state.position, {
			toValue: { x: 0, y: 0 }
		}).start();
	}


	getCardStyle() {
		const { position } = this.state;
		const rotate = position.x.interpolate({
			inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
			outputRange: ['-120deg', '0deg', '120deg']
		});


		return {
			...position.getLayout(),
			transform: [{ rotate }]
		};
	}

	

	renderCards() {

		if(this.state.index >= this.props.data.length) {
			return this.props.renderNoMoreCards();
		}

		return this.props.data.map((item, i) => {

			if (i < this.state.index) { return null; }

			if (i === this.state.index) {
				return (
					//display top card
						<Animated.View
							key={item.id}
							style={[this.getCardStyle(), styles.cardStyle, { zIndex: 100 }]} // interpolated dynamic style animation + multiple styles in array!
							{...this.state.panResponder.panHandlers} 
						>
						{this.props.renderCard(item)}
						</Animated.View>
					);
			}
			return (
				//Cards behind current displayed card
				<Animated.View 
				key={item.id}
				style={[styles.cardStyle, { top: 10 * (i - this.state.index)}, { zIndex: 100 - i} ]}>
				 	{this.props.renderCard(item)}
				</Animated.View>
				);
		}).reverse();
	}

	render() {
		return (
				<View>
					{this.renderCards()}
				</View>
			);
	}
}

const styles = {
	cardStyle: {
		position: 'absolute',
		width: SCREEN_WIDTH,
		zIndex: 1
	}
};

export default Deck;