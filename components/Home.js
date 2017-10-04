import React from 'react';
import {SectionList, View, ActivityIndicator, Text, StatusBar, Platform, TouchableHighlight} from 'react-native';
import NavigationActions from 'react-navigation';
import style from '../Style';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import GroupRow from './containers/GroupRow';
import SectionListHeader from './containers/headers/SectionListHeader';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import {Hideo} from 'react-native-textinput-effects';
import NavigationBar from 'react-native-navbar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import store from 'react-native-simple-store';

export default class Home extends React.Component {

    static navigationOptions = ({navigation}) => {
        let title = 'Groupes';
        return {
            drawerLabel: title,
            drawerIcon: ({tintColor}) => (
                <MaterialIcons
                    name="list"
                    size={24}
                    style={{color: tintColor}}
                />
            ),
            title,
            header: (
                <View
                    style={{
                        paddingTop: (Platform.OS === "android") ? StatusBar.currentHeight : 0,
                        backgroundColor: style.colors.green
                    }}>
                    <NavigationBar
                        title={{title, tintColor: "white"}}
                        tintColor={"transparent"}
                        leftButton={
                            <TouchableHighlight onPress={_ => {
                                navigation.navigate('DrawerOpen')
                            }} underlayColor={"transparent"} style={{
                                justifyContent: 'space-around',
                                paddingLeft: 5
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between'
                                }}>
                                    <MaterialCommunityIcons
                                        name="menu"
                                        size={32}
                                        style={{
                                            color: 'white'
                                        }}
                                    />
                                </View>
                            </TouchableHighlight>
                        }
                    />
                </View>
            )
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            completeList: null,
            sections: null,
            list: null,
            emptySearchResults: false,
            refreshing: false
        };
        store.get("profile").then((profile) => {
                if (profile !== null && profile.group !== null) {
                    const navigateAction = NavigationActions.navigate({
                        routeName: 'Group',
                        params: {name: profile.group}
                    });
                    this.props.navigation.dispatch(navigateAction);
                }
            }
        );
    }

    componentDidMount() {
        this.getList();
    }

    generateSections(list, save = false) {
        let sections = [];
        let sectionContent = null;
        let previousSection = null;
        let sectionIndex = -1;
        list.forEach((e) => {
            let splitName = e.name.split('_');
            if (splitName[0] !== previousSection) {
                if (previousSection !== null) {
                    sections.push(sectionContent);
                }
                previousSection = splitName[0];
                sectionContent = {key: previousSection, data: [], sectionIndex: ++sectionIndex};
            }
            e.sectionStyle = style.list.sections[sectionIndex % style.list.sections.length];
            sectionContent.data.push(e);
        });
        sections.push(sectionContent);
        if (save) {
            store.update('home', {list, sections});
            this.setState({list, sections, completeList: list, refreshing: false});
        } else {
            this.setState({list, sections});
        }
    }

    refreshList() {
        this.setState({refreshing: true});
        this.fetchList();
    }

    getList() {
        store.get("home").then((home) => {
            if (home !== null) {
                this.setState({list: home.list, sections: home.sections})
            } else {
                this.fetchList();
            }
        });
    }

    fetchList() {
        axios.get('https://hackjack.info/et/json.php')
            .then((response) => {
                let groupList = [];
                for (let groupName in response.data) {
                    if (response.data.hasOwnProperty(groupName)) {
                        groupList.push({
                            name: groupName,
                            code: response.data[groupName],
                            cleanName: groupName.replace(/_/g, ' ')
                        });
                    }
                }
                let list = groupList.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                this.generateSections(list, true);
            });
    }

    openGroup(group) {
        const {navigate} = this.props.navigation;
        navigate('Group', {name: group.name, code: group.code});
    }

    search(input) {
        this.setState({sections: null, emptySearchResults: false});
        let list = this.state.completeList;
        if (input.length !== 0) {
            let regex = new RegExp(input, "gi");
            list = list.filter(e => {
                return e.name.replace(/_/g, ' ').match(regex);
            });
        }
        if (list.length > 0) {
            this.setState({emptySearchResults: false});
            this.generateSections(list, false);
        } else {
            this.setState({emptySearchResults: true});
        }
    }

    render() {
        let content;
        let searchInput = (
            <Hideo
                iconClass={FontAwesomeIcon}
                iconName={'search'}
                iconColor={'white'}
                iconBackgroundColor={'#4CAF50'}
                inputStyle={{color: '#464949'}}
                onChangeText={(text) => this.search(text)}
                style={style.list.searchInputView}
            />
        );
        if (this.state.emptySearchResults) {
            content = (
                <View style={style.schedule.course.noCourse}>
                    <Text style={style.schedule.course.noCourseText}>Aucun groupe correspondant à cette recherche n'a
                        été trouvé.</Text>
                </View>
            );
        } else if (this.state.sections === null) {
            content = (
                <ActivityIndicator style={style.containerView} size="large" animating={true}/>
            );
        } else {
            content = (
                <SectionList
                    renderItem={({item, j, index}) => <GroupRow group={item} key={index}
                                                                openGroup={_ => this.openGroup(item)}/>}
                    renderSectionHeader={({section}) => <SectionListHeader title={section.key} key={section.key}
                                                                           sectionIndex={section.sectionIndex}/>}
                    sections={this.state.sections}
                    keyExtractor={(item, index) => index}
                    initialNumToRender={20}
                    onEndReachedThreshold={0.1}
                    style={style.list.sectionList}
                    onRefresh={() => this.refreshList()}
                    refreshing={this.state.refreshing}
                    onEndReached={(info) => console.log('info', info)}
                />
            );
        }
        return (
            <View style={style.list.homeView}>
                {searchInput}
                {content}
            </View>
        );
    }
}