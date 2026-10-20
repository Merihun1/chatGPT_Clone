import {
  createConversationService,
  getRecentConversationRows,
} from "../service/chat.service.js";




export async function createConversationController(req, res) {
    try{
        const {question} = req.body;

    const result = await createConversationService(question);
    res.status(201).json({
        success: true,
        message: 'Conversation posted successfully',
        data: result,
    });  
    } catch (error){
    throw error;
    }
       
};


export async function getConversationsController(req, res) {
    try{
     const result = await getRecentConversationRows(100);
     res.status(201).json({
       success: true,
       message: "Conversation fetched successfully",
       data: result,
     });
          
    } catch (error){
        throw error;
    }
    
};